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
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'notification' }, options);
  return createService(app, NotificationFeedService, NotificationFeedModel, options);
}

init.Service = NotificationFeedService;
