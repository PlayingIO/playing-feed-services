import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import { addActivities, removeActivities, trimFeedActivities } from '../../helpers';
import FlatFeedModel from '../../models/flat-feed.model';
import defaultHooks from './flat-feed.hooks';

const debug = makeDebug('playing:feed-services:flat-feeds');

const defaultOptions = {
  id: 'id',
  name: 'flat-feeds',
  trimChance: 0.01  // the chance to trim the feed, not to grow to infinite size
};

/**
 * The feed service allows you to add and remove activities from a feed.
 */
export class FlatFeedService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
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
    if (params && params.action) {
      return super._action('get', params.action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super.upsert(null, { id, group, target });
  }
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'feed' }, options);
  return createService(app, FlatFeedService, FlatFeedModel, options);
}

init.Service = FlatFeedService;
