import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import FollowshipModel from '~/models/followship.model';
import defaultHooks from './followship.hooks';

const debug = makeDebug('playing:feed-services:followships');

const defaultOptions = {
  name: 'followships'
};

class FollowshipService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'followship' }, options);
  return createService(app, FollowshipService, FollowshipModel, options);
}

init.Service = FollowshipService;
