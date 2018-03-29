import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import defaultHooks from './feed.hooks';
import defaultJobs from './feed.jobs';

const debug = makeDebug('playing:feed-services:feeds');

const defaultOptions = {
  name: 'feeds',
  followLimit: 500, // the number of activities which enter your feed when you follow someone
};

const feedServices = {
  'feed': 'flat-feeds',
  'aggregated': 'aggregated-feeds',
  'notification': 'notification-feeds',
};

/**
 * The Feed Manager class handles the fanout from a user's activity
 *  to all their follower's feeds
 */
class FeedService {
  constructor (options) {
    this.options = Object.assign({}, defaultOptions, options);
    this.name = this.options.name;
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
    const svcFeeds = this.app.service('flat-feeds');
    return svcFeeds.get(id, params);
  }

  /**
   * Add an activity
   */
  async _addActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    const svcFeeds = this.app.service(feedServices[feed.type]);
    await svcFeeds.action('addActivity').patch(id, data, params);
    return feed;
  }

  /**
   * Remove an activity
   */
  async _removeActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    const svcFeeds = this.app.service(feedServices[feed.type]);
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
