import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import ActivityModel from '../../models/activity.model';
import defaultHooks from './activity.hooks';

const debug = makeDebug('playing:feed-services:activities');

const defaultOptions = {
  name: 'activities'
};

export class ActivityService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async create (data, params) {
    const validator = (item) => {
      assert(item.feed && item.feed.indexOf(':undefined') === -1, 'feed is undefined');
      assert(item.actor && item.actor.indexOf(':undefined') === -1, 'actor is undefined');
      assert(item.verb, 'verb is not provided');
      assert(item.object && item.object.indexOf(':undefined') === -1, 'object is undefined');
    };
    const svcFeeds = this.app.service('feeds');
    if (fp.is(Array, data)) {
      assert(data.length, 'cannot create empty array of activities.');
    } else {
      data = [data];
    }
    fp.forEach(validator, data);

    // get all cc activities
    const ccActivities = fp.reduce((arr, item) => {
      const cc = [].concat(item.cc || []);
      if (cc.length > 0) {
        return arr.concat(fp.map(feed => {
          return fp.assoc('feed', feed,
                 fp.dissoc('cc', item));
        }, cc));
      }
      return arr;
    }, [], data);
    data = fp.map(fp.dissoc('cc'), data).concat(ccActivities);

    if (data.length === 1) {
      return super.create(data[0], params);
    } else {
      return super.create(data, params);
    }
  }

  async remove (id, params) {
    params = fp.assign({ query: {} }, params);
    assert(id || params.query.more, 'id or more is not provided.');

    if (params.query.more) {
      let more = fp.splitOrArray(params.query.more);
      if (more.length > 0) {
        if (more[0].foreignId) {
          // remove all activities in the feed with the provided foreignId
          return super.remove(null, {
            query: { foreignId: { $in: fp.map(fp.prop('foreignId'), more) } },
            $multi: true
          });
        } else {
          more = fp.concat(more, id || []);
          return super.remove(null, {
            query: { _id: { $in: more } },
            $multi: true
          });
        }
      }
    } else {
      return super.remove(id, params);
    }
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;
