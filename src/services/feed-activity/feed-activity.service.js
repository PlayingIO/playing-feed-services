import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './feed-activity.hooks';
import { getFeedActivityService, fanoutOperations } from '../../helpers';

const debug = makeDebug('playing:mission-services:feed/activities');

const defaultOptions = {
  name: 'feeds/activities'
};

export class FeedActivityService {
  constructor (options) {
    this.options = fp.assign(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Get activities of the feed
   */
  async find (params) {
    assert(params.sid, 'feed id is not provided.');
    params = fp.assign({ query: {} }, params);
    params.query.feed = params.sid;
    // match for aggregated activities
    const match = params.$match || params.query.$match;

    if (match) {
      delete params.query.$match;
      if (match._id && fp.isObjectId(match._id)) {
        match._id = new mongoose.Types.ObjectId(match._id);
      }
      params.query.activities = { $elemMatch: match };
      let results = await this.app.service('activities').find(params);
      let activities = fp.flatMap(fp.prop('activities'), results.data || []);
      results.data = sift(match, helpers.transform(activities));
      return results;
    } else {
      return this.app.service('activities').find(params);
    }
  }

  /**
   * Add an activity or many activities in bulk
   */
  async create (data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    if (!fp.is(Array, data)) data = [data];

    // Add many activities in bulk
    const svcFeedsActivities = this.app.service(getFeedActivityService(feed.group));
    const results = await svcFeedsActivities.create(data, params);

    // fanout for all following feeds
    const activities = fp.map(fp.assoc('source', params.feed.id), data);
    fanoutOperations(this.app, params.feed.id, 'addActivities', activities, this.options.fanoutLimit);

    return results;
  }

  /**
   * Update an actitity or many activities in bulk
   */
  async patch (id, data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    if (!fp.is(Array, data)) data = [data];

    // update many activities in bulk
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
    const activities = fp.map(fp.assoc('source', feed.id), results);
    fanoutOperations(this.app, feed.id, 'removeActivities', activities, this.options.fanoutLimit);

    return results;
  }
}

export default function init (app, options, hooks) {
  return new FeedActivityService(options);
}

init.Service = FeedActivityService;
