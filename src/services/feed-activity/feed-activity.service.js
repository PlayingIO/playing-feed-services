import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './feed-activity.hooks';

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
}

export default function init (app, options, hooks) {
  return new FeedActivityService(options);
}

init.Service = FeedActivityService;
