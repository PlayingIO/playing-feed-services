import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import FeedModel from '~/models/feed.model';
import defaultHooks from './feed.hooks';

const debug = makeDebug('playing:interaction-services:feeds');

const defaultOptions = {
  id: 'id',
  name: 'feeds'
};

class FeedService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  _getFeedGroup (id) {
    return super.find({ query: { id }}).then((result) => {
      // create one if not exists
      if (result && result.data.length === 0) {
        let [group, target] =  id.split(':');
        if (!target || target === 'undefined') {
          throw new Error('feed target is undefined');
        }
        return super.create({ id, group, target });
      } else {
        return result && result.data[0];
      }
    });
  }

  get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    return this._getFeedGroup(id);
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FeedService, FeedModel, options);
}

init.Service = FeedService;
