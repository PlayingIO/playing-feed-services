const assert = require('assert');
const { Service: BaseService } = require('mostly-feathers');
const fp = require('mostly-func');

const defaultHooks = require('./feed.hooks');
const defaultJobs = require('./feed.jobs');
const { getFeedService } = require('../../helpers');

const defaultOptions = {
  name: 'feeds',
  keepHistory: false // whether the activities from the unfollowed feed should be removed
};

/**
 * The Feed Manager class handles the fanout from a user's activity
 *  to all their follower's feeds
 */
class FeedService extends BaseService {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
  }

  /**
   * find feeds
   */
  async find (params) {
    return this.app.service('flat-feeds').find(params);
  }

  /**
   * Get or create a feed by id
   */
  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).get(id, params);
  }

  /**
   * Update a feed
   */
  async update (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).update(id, data, params);
  }

  /**
   * Patch a feed
   */
  async patch (id, data, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).patch(id, data, params);
  }

  /**
   * Remove a feed
   */
  async remove (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    const [group, target] =  id.split(':');
    return this.app.service(getFeedService(group)).remove(id, params);
  }
}

module.exports = function init (app, options, hooks) {
  return new FeedService(options);
};
module.exports.Service = FeedService;
