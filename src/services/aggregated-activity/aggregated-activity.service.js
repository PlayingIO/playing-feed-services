import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import AggregatedActivityModel from '~/models/aggregated-activity.model';
import defaultHooks from './aggregated-activity.hooks';

const debug = makeDebug('playing:feed-services:activities');

const defaultOptions = {
  name: 'activities'
};

class AggregatedActivityService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async create (data, params) {
    const svcFeeds = this.app.service('feeds');
    assert(data.feed && data.feed.indexOf(':undefined') === -1, 'data.feed is undefined');
    assert(data.activities, 'data.activities is not provided');

    const activity = await super.create(fp.dissoc('cc', data), params);
    return activity;
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'aggregated-activity' }, options);
  return createService(app, AggregatedActivityService, AggregatedActivityModel, options);
}

init.Service = AggregatedActivityService;
