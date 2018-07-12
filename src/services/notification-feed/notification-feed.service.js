const assert = require('assert');
const makeDebug = require('debug');
const { createService } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');

const aggregatedFeed = require('../aggregated-feed/aggregated-feed.service');
const NotificationFeedModel = require('../../models/notification-feed.model');
const defaultHooks = require('./notification-feed.hooks');

const debug = makeDebug('playing:feed-services:notification-feeds');

class NotificationFeedService extends aggregatedFeed.Service {
  constructor (options) {
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    assert(id.startsWith('notification'), 'feed id is not an notification feed');

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('notification-feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }
}

module.exports = function init (app, options, hooks) {
  options = { ModelName: 'notification', ...options };
  return createService(app, NotificationFeedService, NotificationFeedModel, options);
};
module.exports.Service = NotificationFeedService;
