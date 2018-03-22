import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import ActivityModel from '~/models/activity.model';
import defaultHooks from './activity.hooks';

const debug = makeDebug('playing:interaction-services:activities');

const defaultOptions = {
  name: 'activities'
};

class ActivityService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async create (data, params) {
    const svcFeeds = this.app.service('feeds');
    assert(data.feed && data.feed.indexOf(':undefined') === -1, 'data.feed is undefined');
    assert(data.actor && data.actor.indexOf(':undefined') === -1, 'data.actor is undefined');
    assert(data.verb, 'data.verb is not provided');
    assert(data.object && data.object.indexOf(':undefined') === -1, 'data.object is undefined');

    const copyFeed = async (cc) => {
      const feed = await svcFeeds.get(cc);
      if (feed) {
        data = fp.assoc('feed', feed.id,
               fp.dissoc('cc', data));
        return this.create(data);
      }
    };

    const activity = await super.create(fp.dissoc('cc', data), params);
    if (data.cc && data.cc.length > 0) {
      await Promise.all(fp.map(copyFeed, data.cc));
    }
    return activity;
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;