import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './feed-activity.hooks';
import { getFeedType, getFeedActivityService, fanoutOperations } from '../../helpers';

const debug = makeDebug('playing:mission-services:feed/activities');

const defaultOptions = {
  name: 'feeds/activities',
  fanoutLimit: 100,  // number of following feeds are handled in one task when doing the fanout
};

export class FeedActivityService {
  constructor (options) {
    this.options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  async _elemMatchActivities (id, params) {
    const match = fp.filterWithKeys(fp.complement(fp.startsWith('$')), params.query);
    id = id || match._id;
    if (id && fp.isObjectId(id)) {
      match._id = new mongoose.Types.ObjectId(id);
    }
    // keep all special query starts with $
    params.query = fp.filterWithKeys(fp.startsWith('$'), params.query);
    params.query.feed = params.primary;
    params.query.activities = { $elemMatch: match };
    // $select for actvities
    if (params.query.$select) {
      params.query.$select = helpers.prefixSelect(params.query.$select, 'activities');
    }
    let results = await this.app.service('aggregations').find(params);
    let activities = fp.flatMap(fp.prop('activities'), results.data || []);
    results.data = helpers.transform(sift(match, activities));
    return results;
  }

  /**
   * Get activities of the feed
   */
  async find (params) {
    assert(params.primary, 'feed id is not provided.');
    params = { query: {}, ...params };

    // match for aggregated activities
    params.query.feed = params.primary;
    if (getFeedType(params.primary) !== 'flat') {
      return this._elemMatchActivities(null, params);
    } else {
      return this.app.service('activities').find(params);
    }
  }

  /**
   * Get activity of the feed
   */
  async get (id, params) {
    assert(params.primary, 'feed id is not provided.');
    params = { query: {}, ...params };

    // match for aggregated activity
    if (getFeedType(params.primary) !== 'flat') {
      const results = await this._elemMatchActivities(id, params);
      if (results && results.data) {
        return results.data.length && results.data[0];
      }
    } else {
      return this.app.service('activities').get(id, params);
    }
  }

  /**
   * Add an activity or many activities in bulk
   */
  async create (data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    data = fp.asArray(data);

    // Add many activities in bulk
    const svcFeedsActivities = this.app.service(getFeedActivityService(feed.group));
    const results = await svcFeedsActivities.create(data, params);

    // fanout for all following feeds
    const activities = fp.map(fp.assoc('source', feed.id), data);
    fanoutOperations(this.app, feed.id, 'addActivities', activities, this.options.fanoutLimit);

    return results;
  }

  /**
   * Update an actitity or many activities in bulk
   */
  async update (id, data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');

    // update many activities in bulk
    const svcFeedsActivities = this.app.service(getFeedActivityService(feed.group));
    const results = await svcFeedsActivities.update(id, data, params);

    return results;
  }

  /**
   * Patch an actitity or many activities in bulk
   */
  async patch (id, data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');

    // patch many activities in bulk
    const svcFeedsActivities = this.app.service(getFeedActivityService(feed.group));
    const results = await svcFeedsActivities.patch(id, data, params);

    return results;
  }

  /**
   * Remove an activity or more activities in bulk
   */
  async remove (id, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');

    // remove many activities in bulk
    const svcFeedsActivities = this.app.service(getFeedActivityService(feed.group));
    const results = await svcFeedsActivities.remove(id, params);

    // fanout for all following feeds
    const activities = fp.asArray(results && results.data || results);
    fanoutOperations(this.app, feed.id, 'removeActivities', activities, this.options.fanoutLimit);

    return results;
  }
}

export default function init (app, options, hooks) {
  return new FeedActivityService(options);
}

init.Service = FeedActivityService;
