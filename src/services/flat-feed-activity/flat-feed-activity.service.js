import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './flat-feed-activity.hooks';
import { addActivities, removeActivities, trimFeedActivities } from '../../helpers';

const debug = makeDebug('playing:mission-services:flat-feeds/activities');

const defaultOptions = {
  name: 'flat-feeds/activities'
};

export class FlatFeedActivityService {
  constructor (options) {
    this.options = fp.assign(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

}

export default function init (app, options, hooks) {
  return new FlatFeedActivityService(options);
}

init.Service = FlatFeedActivityService;
