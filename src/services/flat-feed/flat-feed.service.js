import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import FlatFeedModel from '../../models/flat-feed.model';
import defaultHooks from './flat-feed.hooks';

const debug = makeDebug('playing:feed-services:flat-feeds');

const defaultOptions = {
  id: 'id',
  name: 'flat-feeds'
};

/**
 * The feed service allows you to add and remove activities from a feed.
 */
export class FlatFeedService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Get or create a feed by id
   */
  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }
}

export default function init (app, options, hooks) {
  options = { ModelName: 'feed', ...options };
  return createService(app, FlatFeedService, FlatFeedModel, options);
}

init.Service = FlatFeedService;
