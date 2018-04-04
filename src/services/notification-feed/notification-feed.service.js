import assert from 'assert';
import makeDebug from 'debug';
import { createService } from 'mostly-feathers-mongoose';

import aggregatedFeed from '../aggregated-feed/aggregated-feed.service';
import NotificationFeedModel from '../../models/notification-feed.model';
import defaultHooks from './notification-feed.hooks';

const debug = makeDebug('playing:feed-services:notification-feeds');

export class NotificationFeedService extends aggregatedFeed.Service {
  constructor (options) {
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    assert(id.startsWith('notification'), 'feed id is not an notification feed');
    if (params && params.__action) {
      return super._action('get', params.__action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('notification-feed target is undefined');
    }
    return super._upsert(null, { id, group, target });
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'notification' }, options);
  return createService(app, NotificationFeedService, NotificationFeedModel, options);
}

init.Service = NotificationFeedService;
