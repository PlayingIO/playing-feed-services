import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import { addActivities, formatAggregation, trimFeedActivities } from '../../helpers';
import AggregatedFeedModel from '../../models/aggregated-feed.model';
import defaultHooks from './aggregated-feed.hooks';

const debug = makeDebug('playing:feed-services:aggregated-feeds');

const defaultOptions = {
  id: 'id',
  name: 'aggregated-feeds',
  mergeMaxLength: 20, // number of aggregated items to search to see if we match
                      // or create a new aggregated activity
  trimChance: 0.01    // the chance to trim the feed, not to grow to infinite size
};

export class AggregatedFeedService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    assert(id.startsWith('aggregated'), 'feed id is not an aggregated feed');
    if (params && params.action) {
      return super._action('get', params.action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('aggregated-feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }

  /**
   * Add many activities in bulk
   */
  async addMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.isArray(data) && data.length > 0, 'data is an array not empty.');
    data = fp.map(item => {
      item.feed = feed.id,
      item.group = formatAggregation(feed.aggregation, item);
      return item;
    }, data);

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.create(data, { $rank: feed.rank });

    // aggregated feed do not support cc at present,
    // often an activity is add to a flat feed and cc to an aggregated feed
    // so there maybe duplication when the aggregated feed is following the flat feed

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
    assert(fp.isArray(data) && data.length > 0, 'data is an array not empty.');

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.patch(null, data, { $multi: true });

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Remove an activity in bulk
   */
  async removeMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.isArray(data) && data.length > 0, 'data is an array not empty.');

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.remove(null, { query: { more: data } });

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'aggregated' }, options);
  return createService(app, AggregatedFeedService, AggregatedFeedModel, options);
}

init.Service = AggregatedFeedService;
