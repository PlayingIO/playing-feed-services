import assert from 'assert';
import makeDebug from 'debug';
import { filter, unionWith } from 'lodash';
import { Service, createService } from 'mostly-feathers-mongoose';
import FeedModel from '~/models/feed-model';
import defaultHooks from './feed-hooks';

const debug = makeDebug('playing:interaction-services:feeds');

const defaultOptions = {
  id: 'group',
  name: 'feeds'
};

class FeedService extends Service {
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
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FeedService, FeedModel, options);
}

init.Service = FeedService;
