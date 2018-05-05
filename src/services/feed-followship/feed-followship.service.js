import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './feed-followship.hooks';
import defaultJobs from './feed-followship.jobs';

const debug = makeDebug('playing:mission-services:feeds/followships');

const defaultOptions = {
  name: 'feeds/followships',
  followLimit: 500,  // the number of activities which enter your feed when you follow someone
};

export class FeedFollowshipService {
  constructor (options) {
    this.options = fp.assign(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
  }

  /**
   * Follow target feed
   */
  async create (data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    assert(data.target, 'data.target is not provided.');

    const svcFeeds = this.app.service('feeds');
    const svcFollowship = this.app.service('followships');

    let followship = await svcFollowship.get(null, {
      query: { follower: feed.id, followee: data.target }
    });
    if (followship) return followship; // already followed

    const targetFeed = await svcFeeds.get(data.target);
    assert(targetFeed, 'target feed is not exists.');
    assert(!fp.contains(targetFeed.group,
      ['aggregated', 'notification']), 'target feed must be a flat feed.');

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
  async remove (id, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    assert(id, 'source id is not provided.');

    const svcFeeds = this.app.service('feeds');
    const svcFollowship = this.app.service('followships');

    let followship = await svcFollowship.get(null, { query: {
      follower: feed.id, followee: id
    }});
    if (!followship) return null; // already unfollowed

    const sourceFeed = await svcFeeds.get(id);
    assert(sourceFeed, 'source feed is not exists.');
    assert(!fp.contains(sourceFeed.group,
      ['aggregated', 'notification']), 'target feed must be a flat feed.');

    followship = await svcFollowship.remove(null, {
      query: { follower: feed.id, followee: sourceFeed.id },
      $multi: true
    });

    // task to unfollow activities if not keep history
    if (!(params.query.keepHistory || this.options.keepHistory)) {
      this.app.agenda.now('feed_unfollow_many', {
        feed: feed.id, sources: [sourceFeed.id]
      });
    }

    return followship;
  }
}

export default function init (app, options, hooks) {
  return new FeedFollowshipService(options);
}

init.Service = FeedFollowshipService;
