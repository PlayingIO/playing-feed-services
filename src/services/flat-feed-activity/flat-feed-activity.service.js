import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';

import defaultHooks from './flat-feed-activity.hooks';
import { addActivities, removeActivities, trimFeedActivities } from '../../helpers';

const debug = makeDebug('playing:mission-services:flat-feeds/activities');

const defaultOptions = {
  name: 'flat-feeds/activities',
  trimChance: 0.01  // the chance to trim the feed, not to grow to infinite size
};

export class FlatFeedActivityService {
  constructor (options) {
    this.options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Add an activity or many activities in bulk
   */
  async create (data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');
    data = fp.asArray(data);

    data = fp.map(fp.assoc('feed', feed.id), data);

    // add provided activities
    const svcActivities = this.app.service('activities');
    const results = await svcActivities.create(data, params);

    // get all cc activities
    const ccActivities = fp.reduce((acc, activity) => {
      const ccFeeds = fp.uniq(activity.cc || []); // dedup cc
      for (const cc of ccFeeds) {
        const item = fp.assoc('source', feed.id, fp.dissoc('cc', activity));
        acc[cc] = acc[cc] || [];
        acc[cc].push(item);
      }
      return acc;
    }, {}, data);
    if (!fp.isEmpty(ccActivities)) {
      // add all cc activities
      const addAll = fp.map(([feed, activities]) =>
        addActivities(this.app, feed, activities),
        fp.toPairs(ccActivities));
      await Promise.all(addAll);
    }

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Update an actitity or many activities in bulk
   */
  async update (id, data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcActivities = this.app.service('activities');
    const results = await svcActivities.update(id, data, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Patch an actitity or many activities in bulk
   */
  async patch (id, data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcActivities = this.app.service('activities');
    const results = await svcActivities.patch(id, data, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Remove an activity or more activities in bulk
   */
  async remove (id, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcActivities = this.app.service('activities');
    const results = await svcActivities.remove(id, params);

    // remove also cc activities
    if (results.length > 0) {
      const ccActivities = fp.reduce((acc, activity) => {
        if (activity.cc && activity.cc.length > 0) {
          activity.cc.forEach(cc => {
            acc[cc] = acc[cc] || [];
            acc[cc] = fp.union(acc[cc], [{ id: activity.id }]);
          });
        }
        return acc;
      }, {}, results);
      // remove all cc activities
      const removeAll = fp.map(([feed, activities]) =>
        removeActivities(this.app, feed, activities),
        fp.toPairs(ccActivities));
      await Promise.all(removeAll);
    }

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }
}

export default function init (app, options, hooks) {
  return new FlatFeedActivityService(options);
}

init.Service = FlatFeedActivityService;
