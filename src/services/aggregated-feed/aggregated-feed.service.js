const assert = require('assert');
const makeDebug = require('debug');
const { Service, createService } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');

const AggregatedFeedModel = require('../../models/aggregated-feed.model');
const defaultHooks = require('./aggregated-feed.hooks');

const debug = makeDebug('playing:feed-services:aggregated-feeds');

const defaultOptions = {
  id: 'id',
  name: 'aggregated-feeds',
  mergeMaxLength: 20, // number of aggregated items to search to see if we match
                      // or create a new aggregated activity
  trimChance: 0.01    // the chance to trim the feed, not to grow to infinite size
};

class AggregatedFeedService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    assert(id.startsWith('aggregated'), 'feed id is not an aggregated feed');

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('aggregated-feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }
}

module.exports = function init (app, options, hooks) {
  options = { ModelName: 'aggregated', ...options };
  return createService(app, AggregatedFeedService, AggregatedFeedModel, options);
};
module.exports.Service = AggregatedFeedService;
