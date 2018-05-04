import assert from 'assert';
import { Service as BaseService } from 'mostly-feathers';
import fp from 'mostly-func';

import defaultHooks from './feed.hooks';
import defaultJobs from './feed.jobs';
import { getFeedService } from '../../helpers';

const defaultOptions = {
  name: 'feeds',
  keepHistory: false // whether the activities from the unfollowed feed should be removed
};

/**
 * The Feed Manager class handles the fanout from a user's activity
 *  to all their follower's feeds
 */
export class FeedService extends BaseService {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
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

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).get(id, params);
  }

  /**
   * Update a feed
   */
  async update (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).update(id, data, params);
  }

  /**
   * Patch a feed
   */
  async patch (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).patch(id, data, params);
  }

  /**
   * Remove a feed
   */
  async remove (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).remove(id, params);
  }

  /**
   * Unfollow source feed
   */
  async unfollow (id, data, params, feed) {
    assert(data.source, 'data.source is not provided.');

    const svcFollowship = this.app.service('followships');
    let followship = await svcFollowship.action('first').find({ query: {
      follower: feed.id, followee: data.source
    }});
    if (!followship) return null; // already unfollowed

    const sourceFeed = await this.get(data.source);
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
  return new FeedService(options);
}

init.Service = FeedService;
