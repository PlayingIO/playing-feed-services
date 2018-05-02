import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import { addActivities, removeActivities, trimFeedActivities } from '../../helpers';
import FlatFeedModel from '../../models/flat-feed.model';
import defaultHooks from './flat-feed.hooks';

const debug = makeDebug('playing:feed-services:flat-feeds');

const defaultOptions = {
  id: 'id',
  name: 'flat-feeds',
  trimChance: 0.01  // the chance to trim the feed, not to grow to infinite size
};

/**
 * The feed service allows you to add and remove activities from a feed.
 */
export class FlatFeedService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Get or create a feed by id
   */
  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.action) {
      return super._action('get', params.action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }

  /**
   * Add many activities in bulk
   */
  async addMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array not empty.');
    data = fp.map(fp.assoc('feed', feed.id), data);

    // add provided activities
    const svcActivities = this.app.service('activities');
    const results = await svcActivities.create(data);

    // get all cc activities
    const ccActivities = fp.reduce((acc, item) => {
      const cc = [].concat(item.cc || []);
      for (const feed of cc) {
        acc[feed] = acc[feed] || [];
        acc[feed].push(fp.dissoc('cc', item));
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
   * Update many activities in bulk
   */
  async updateMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array not empty.');

    const svcActivities = this.app.service('activities');
    const results = await Promise.all(fp.map(activity =>
      svcActivities.patch(activity.id, activity), data));

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Remove many activities in bulk
   */
  async removeMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array not empty.');

    const svcActivities = this.app.service('activities');
    const results = await svcActivities.remove(null, { query: { more: data } });

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
  options = fp.assign({ ModelName: 'feed' }, options);
  return createService(app, FlatFeedService, FlatFeedModel, options);
}

init.Service = FlatFeedService;
