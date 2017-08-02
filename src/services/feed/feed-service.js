import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'ramda';
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

  _getFeedGroup(group, target) {
    return super.find({ query: {
      group: group,
      target: target
    }}).then((result) => {
      // create one if not exists
      if (result && result.data.length === 0) {
        return super.create({
          group: group,
          target: target
        });
      } else {
        return result && result.data[0];
      }
    });
  }

  get(id, params) {
    params = params || { query: {} };

    let target = params.__action;
    if (id && id.indexOf('/') > 0) {
      [id, target] = id.split('/');
    }

    if (target) {
      return this._getFeedGroup(id, target);
    } else {
      return super.get(id, params);
    }
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FeedService, FeedModel, options);
}

init.Service = FeedService;
