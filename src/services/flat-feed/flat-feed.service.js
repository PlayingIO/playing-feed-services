import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import { addActivities } from '../../helpers';
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
    options = Object.assign({}, defaultOptions, options);
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
   * Add many activities in bulk
   */
  async _addMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array or is empty.');
    data = fp.map(fp.assoc('feed', feed.id), data);

    // add provided activities
    const svcActivities = this.app.service('activities');
    await svcActivities.create(data);

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
      const addAll = fp.map(feed => {
        return addActivities(this.app, feed, ccActivities[feed]);
      }, fp.keys(ccActivities));
      await Promise.all(addAll);
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
    const more = fp.map(m => {
      if (m.foreignId) return { feed: feed.id, foreignId: m.foreignId };
      return { feed: feed.id, id: helpers.getId(m) };
    }, data);

    const svcActivities = this.app.service('activities');
    await svcActivities.remove(null, { query: { more } });

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await this._trim(id, null, null, feed);
    }
    return feed;
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
        return svcActivities.remove(null, { query: {
          _id: { $lt: maxActivity[0].id },
          $multi: true
        }});
      }
    }
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FlatFeedService, FlatFeedModel, options);
}

init.Service = FlatFeedService;
