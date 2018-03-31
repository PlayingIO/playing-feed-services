import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import AggregationModel from '../../models/aggregation.model';
import defaultHooks from './aggregation.hooks';

const debug = makeDebug('playing:feed-services:aggregations');

const defaultOptions = {
  name: 'aggregations'
};

export class AggregationService extends Service {
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
  options = Object.assign({ ModelName: 'aggregation' }, options);
  return createService(app, AggregationService, AggregationModel, options);
}

init.Service = AggregationService;
