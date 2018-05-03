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
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'aggregated' }, options);
  return createService(app, AggregatedFeedService, AggregatedFeedModel, options);
}

init.Service = AggregatedFeedService;
