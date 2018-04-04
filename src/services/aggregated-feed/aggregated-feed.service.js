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
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    assert(id.startsWith('aggregated'), 'feed id is not an aggregated feed');
    if (params && params.__action) {
      return super._action('get', params.__action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('aggregated-feed target is undefined');
    }
    return super._upsert(null, { id, group, target });
  }

  /**
   * Add many activities in bulk
   */
  async _addMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array or is empty.');
    data = fp.map(item => {
      item.feed = feed.id,
      item.group = formatAggregation(feed.aggregation, item);
      return item;
    }, data);

    const svcAggregations = this.app.service('aggregations');
    await svcAggregations.create(data);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return feed;
  }

  /**
   * Remove an activity in bulk
   */
  async _removeMany (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(data.activity || data.foreignId, 'activity or foreignId is not provided.');

    const svcAggregations = this.app.service('aggregations');
    if (data.foreignId) {
      const more = { foreignId: data.foreignId };
      await svcAggregations.remove(null, { query: { more } });
    } else {
      await svcAggregations.remove(data.activity);
    }

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return feed;
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'aggregated' }, options);
  return createService(app, AggregatedFeedService, AggregatedFeedModel, options);
}

init.Service = AggregatedFeedService;
