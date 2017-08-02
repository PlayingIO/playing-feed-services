import assert from 'assert';
import makeDebug from 'debug';
import { filter, flatten, groupBy, map, unionWith } from 'lodash';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import { plural } from 'pluralize';
import ActivityModel from '~/models/activity-model';
import defaultHooks from './activity-hooks';

const debug = makeDebug('playing:interaction-services:activities');

const defaultOptions = {
  name: 'activities'
};

class ActivityService extends Service {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;
