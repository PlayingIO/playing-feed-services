import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import FeedModel from '~/models/feed.model';
import defaultHooks from './feed.hooks';
import defaultJobs from './feed.jobs';

const debug = makeDebug('playing:feed-services:feeds');

const defaultOptions = {
  id: 'id',
  name: 'feeds',
  followLimit: 500, // the number of activities which enter your feed when you follow someone
  trimChance: 0.01  // the chance to trim the feed, not to grow to infinite size
};

class FeedService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
  }

  /**
   * Get or create a feed by id
   */
  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('get', params.__action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super._upsert(null, { id, group, target });
  }

  /**
   * Add an activity
   */
  async _addActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(data.actor && data.verb && data.object, 'activity is not provided.');
    data.feed = feed.id;

    const svcActivities = this.app.service('activities');
    await svcActivities.create(data);
    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await this._trim(id, null, null, feed);
    }
    return feed;
  }

  /**
   * Add many activities in bulk
   */
  async _addMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array or is empty.');
    data = fp.map(fp.assoc('feed', feed.id), data);

    const svcActivities = this.app.service('activities');
    await svcActivities.create(data);
    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await this._trim(id, null, null, feed);
    }
    return feed;
  }

  /**
   * Remove an activity
   */
  async _removeActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(data.activity || data.foreignId, 'activity or foreignId is not provided.');

    const svcActivities = this.app.service('activities');
    if (data.foreignId) {
      await svcActivities.remove(null, {
        query: { foreignId: data.foreignId },
        $multi: true
      });
    } else {
      await svcActivities.remove(data.activity);
    }
    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await this._trim(id, null, null, feed);
    }
    return feed;
  }

  /**
   * Remove many activities in bulk
   */
  async _removeMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array or is empty.');
    const more = fp.map(helpers.getId, data);

    const svcActivities = this.app.service('activities');
    await svcActivities.remove(null, { query: { more } });
    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await this._trim(id, null, null, feed);
    }
    return feed;
  }

  /**
   * Get activities of the feed
   */
  async _activities (id, data, params, feed) {
    params = fp.assign({ query: {} }, params);
    assert(feed, 'feed is not exists.');
    params.query.feed = feed.id;

    return this.app.service('activities').find(params);
  }

  /**
   * Follow target feed
   */
  async _follow (id, data, params, feed) {
    assert('data.target', 'data.target is not provided.');

    const svcFollowship = this.app.service('followships');
    let followship = await svcFollowship.action('first').find({ query: {
      follower: feed.id, followee: data.target
    }});
    if (followship) return followship; // already followed

    const targetFeed = await this.get(data.target);
    assert(targetFeed, 'target feed is not exists.');

    followship = await svcFollowship.create({
      follower: feed.id, followee: targetFeed.id
    });

    // task to follow activities
    this.app.agenda.now('feed_follow_many', {
      feed: feed.id, targets: [targetFeed.id], limit: this.options.followLimit
    });

    return followship;
  }

  /**
   * Unfollow source feed
   */
  async _unfollow (id, data, params, feed) {
    assert('data.source', 'data.source is not provided.');

    const svcFollowship = this.app.service('followships');
    let followship = await svcFollowship.action('first').find({ query: {
      follower: feed.id, followee: data.source
    }});
    if (!followship) return null; // already unfollowed

    const sourceFeed = await this.get(data.source);
    assert(sourceFeed, 'source feed is not exists.');

    followship = await svcFollowship.remove({
      query: { follower: feed.id, followee: sourceFeed.id },
      $multi: true
    });

    // task to unfollow activities
    this.app.agenda.now('feed_unfollow_many', {
      feed: feed.id, sources: [sourceFeed.id]
    });

    return followship;
  }

  /**
   * trim the feed
   */
  async _trim (id, data, params, feed) {
    const svcActivities = this.app.service('activities');
    if (feed && feed.maxLength) {
      const maxActivity = await svcActivities.find({
        query: { $select: 'id', $skip: feed.maxLength - 1, $limit: 1 },
        paginate: false
      });
      if (maxActivity && maxActivity.length > 0) {
        await svcActivities.remove(null, { query: {
          _id: { $lt: maxActivity[0].id },
          $multi: true
        }});
      }
    }
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FeedService, FeedModel, options);
}

init.Service = FeedService;
