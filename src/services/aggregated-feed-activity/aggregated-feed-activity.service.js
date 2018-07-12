const assert = require('assert');
const makeDebug = require('debug');
const fp = require('mostly-func');

const defaultHooks = require('./aggregated-feed-activity.hooks');
const { formatAggregation, trimFeedActivities } = require('../../helpers');

const debug = makeDebug('playing:mission-services:aggregated-feeds/activities');

const defaultOptions = {
  name: 'aggregated-feeds/activities'
};

class AggregatedFeedActivityService {
  constructor (options) {
    this.options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Add an activity or many activities in bulk
   */
  async create (data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    data = fp.map(item => {
      item.feed = feed.id,
      item.group = formatAggregation(feed.aggregation, item);
      return item;
    }, fp.asArray(data));

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.create(data, fp.assoc('$rank', feed.rank, params));

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
   * Update an actitity or many activities in bulk
   */
  async update (id, data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.update(id, data, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Patch an actitity or many activities in bulk
   */
  async patch (id, data, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.patch(id, data, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Remove an activity or more activities in bulk
   */
  async remove (id, params) {
    const feed = params.primary;
    assert(feed && feed.id, 'feed is not provided');

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.remove(id, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }
}

module.exports = function init (app, options, hooks) {
  return new AggregatedFeedActivityService(options);
};
module.exports.Service = AggregatedFeedActivityService;
