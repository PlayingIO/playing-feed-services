const makeDebug = require('debug');
const fp = require('mostly-func');

const aggregatedFeedActivity = require('../aggregated-feed-activity/aggregated-feed-activity.service');
const defaultHooks = require('./notification-feed-activity.hooks');

const debug = makeDebug('playing:mission-services:notification-feeds/activities');

const defaultOptions = {
  name: 'notification-feeds/activities'
};

class NotificationFeedActivityService extends aggregatedFeedActivity.Service {
  constructor (options) {
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

module.exports = function init (app, options, hooks) {
  return new NotificationFeedActivityService(options);
};
module.exports.Service = NotificationFeedActivityService;
