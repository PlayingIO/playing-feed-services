import assert from 'assert';
import makeDebug from 'debug';
import { Service as BaseService } from 'mostly-feathers';
import fp from 'mostly-func';

import defaultHooks from './feed.hooks';
import defaultJobs from './feed.jobs';

const debug = makeDebug('playing:feed-services:feeds');

const defaultOptions = {
  name: 'feeds',
  followLimit: 500, // the number of activities which enter your feed when you follow someone
};

/**
 * The Feed Manager class handles the fanout from a user's activity
 *  to all their follower's feeds
 */
class FeedService extends BaseService {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
  }

  service (group) {
    switch (group) {
      case 'aggregated': return this.app.service('aggregated-feeds');
      case 'notification': return this.app.service('notification-feeds');
      default: return this.app.service('flat-feeds');
    }
  }

  /**
   * find feeds
   */
  async find (params) {
    return this.app.service('flat-feeds').find(params);
  }

  /**
   * Get or create a feed by id
   */
  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('get', params.__action, id, null, params);
    } else {
      const [group, target] =  id.split(':');
      return this.service(group).get(id, params);
    }
  }

  /**
   * Update a feed
   */
  async update (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('update', params.__action, id, data, params);
    } else {
      const [group, target] =  id.split(':');
      return this.service(group).update(id, data, params);
    }
  }

  /**
   * Patch a feed
   */
  async patch (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('patch', params.__action, id, data, params);
    } else {
      const [group, target] =  id.split(':');
      return this.service(group).patch(id, data, params);
    }
  }

  /**
   * Remove a feed
   */
  async remove (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('remove', params.__action, id, null, params);
    } else {
      const [group, target] =  id.split(':');
      return this.service(group).remove(id, params);
    }
  }

  /**
   * Add an activity
   */
  async _addActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    const svcFeeds = this.service(feed.group);
    await svcFeeds.action('addActivity').patch(id, data, params);
    return feed;
  }

  /**
   * Remove an activity
   */
  async _removeActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    const svcFeeds = this.service(feed.group);
    await svcFeeds.action('removeActivity').patch(id, data, params);
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
    assert(data.target, 'data.target is not provided.');

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
    assert(data.source, 'data.source is not provided.');

    const svcFollowship = this.app.service('followships');
    let followship = await svcFollowship.action('first').find({ query: {
      follower: feed.id, followee: data.source
    }});
    if (!followship) return null; // already unfollowed

    const sourceFeed = await this.get(data.source);
    assert(sourceFeed, 'source feed is not exists.');

    followship = await svcFollowship.remove(null, {
      query: { follower: feed.id, followee: sourceFeed.id },
      $multi: true
    });

    // task to unfollow activities
    this.app.agenda.now('feed_unfollow_many', {
      feed: feed.id, sources: [sourceFeed.id]
    });

    return followship;
  }
}

export default function init (app, options, hooks) {
  return new FeedService(options);
}

init.Service = FeedService;
