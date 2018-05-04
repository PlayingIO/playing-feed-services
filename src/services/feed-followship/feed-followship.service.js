import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './feed-followship.hooks';

const debug = makeDebug('playing:mission-services:feed/followships');

const defaultOptions = {
  name: 'feeds/followships',
  followLimit: 500,  // the number of activities which enter your feed when you follow someone
};

export class FeedFollowshipService {
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
  return new FeedFollowshipService(options);
}

init.Service = FeedFollowshipService;
