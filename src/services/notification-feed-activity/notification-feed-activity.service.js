import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import aggregatedFeedActivity from '../aggregated-feed-activity/aggregated-feed-activity.service';
import defaultHooks from './notification-feed-activity.hooks';
import { addActivities, formatAggregation, trimFeedActivities } from '../../helpers';

const debug = makeDebug('playing:mission-services:notification-feeds/activities');

const defaultOptions = {
  name: 'notification-feeds/activities'
};

export class NotificationFeedActivityService extends aggregatedFeedActivity.Service {
  constructor (options) {
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

export default function init (app, options, hooks) {
  return new NotificationFeedActivityService(options);
}

init.Service = NotificationFeedActivityService;
