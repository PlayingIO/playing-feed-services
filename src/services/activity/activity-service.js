import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import { plural } from 'pluralize';
import fp from 'ramda';
import ActivityModel from '~/models/activity-model';
import defaultHooks from './activity-hooks';

const debug = makeDebug('playing:interaction-services:activities');

const defaultOptions = {
  name: 'activities'
};

class ActivityService extends Service {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  create(data, params) {
    const feeds = this.app.service('feeds');
    assert(data.feed && data.feed.indexOf(':undefined') === -1, 'data.feed is undefined');
    assert(data.actor && data.actor.indexOf(':undefined') === -1, 'data.actor is undefined');
    assert(data.verb, 'data.verb is not provided');
    assert(data.object && data.object.indexOf(':undefined') === -1, 'data.object is undefined');
    
    return super.create(fp.dissoc('cc', data), params)
      .then((activity) => {
        if (data.cc && data.cc.length > 0) {
          return Promise.all(data.cc.map((cc) => {
            return feeds.get(cc).then((feed) => {
              if (feed) {
                data = fp.compose(
                  fp.assoc('feed', feed.id),
                  fp.dissoc('cc')
                )(data);
                return this.create(data);
              }
            });
          }));
        }
      });
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;
