const assert = require('assert');
const makeDebug = require('debug');
const { Service, createService } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');

const FlatFeedModel = require('../../models/flat-feed.model');
const defaultHooks = require('./flat-feed.hooks');

const debug = makeDebug('playing:feed-services:flat-feeds');

const defaultOptions = {
  id: 'id',
  name: 'flat-feeds'
};

/**
 * The feed service allows you to add and remove activities from a feed.
 */
class FlatFeedService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
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

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }
}

module.exports = function init (app, options, hooks) {
  options = { ModelName: 'feed', ...options };
  return createService(app, FlatFeedService, FlatFeedModel, options);
};
module.exports.Service = FlatFeedService;
