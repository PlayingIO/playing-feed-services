import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import ActivityModel from '../../models/activity.model';
import defaultHooks from './activity.hooks';
import { validateUpdateActivity } from '../../helpers';

const debug = makeDebug('playing:feed-services:activities');

const defaultOptions = {
  name: 'activities'
};

export class ActivityService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Create an activity or many activities in bulk
   */
  async create (data, params) {
    const validator = (item) => {
      assert(item.feed && item.feed.indexOf(':undefined') === -1, 'feed is undefined');
      assert(item.actor && item.actor.indexOf(':undefined') === -1, 'actor is undefined');
      assert(item.verb, 'verb is not provided');
      assert(item.object && item.object.indexOf(':undefined') === -1, 'object is undefined');
    };
    data = fp.asArray(data);
    fp.forEach(validator, data);

    if (data.length === 1) {
      return super.create(data[0], params);
    } else {
      return super.create(data, params);
    }
  }

  /**
   * Update an activity or many activities in bulk
   */
  async update (id, data, params) {
    params = fp.assign({ query: {} }, params);
    // bulk update with data array
    if (fp.isArray(data)) {
      fp.forEach(validateUpdateActivity, data);
      return this.Model.updateActivities(data);
    }
    // update one with foreignId/time
    if (params.query.foreignId && params.query.time) {
      return super.update(null, data, fp.assign({
        query: { foreignId: params.query.foreignId, time: params.query.time },
        $multi: true
      }, params));
    }
    return super.update(id, data, params);
  }

  /**
   * Patch an activity or many activities in bulk
   */
  async patch (id, data, params) {
    params = fp.assign({ query: {} }, params);
    // bulk update with data array
    if (fp.isArray(data)) {
      fp.forEach(validateUpdateActivity, data);
      return this.Model.updateActivities(data);
    }
    // update one with foreignId/time
    if (params.query.foreignId && params.query.time) {
      return super.patch(null, data, fp.assign({
        query: { foreignId: params.query.foreignId, time: params.query.time },
        $multi: true
      }, params));
    }
    return super.patch(id, data, params);
  }

  /**
   * Remove an activity or many activities in bulk
   */
  async remove (id, params) {
    params = fp.assign({ query: {} }, params);
    assert(id || params.query.more, 'id or more is not provided.');

    if (params.query.more) {
      let more = fp.splitOrArray(params.query.more);
      if (more.length > 0) {
        let query = null;
        // by object id
        if (more[0].id) {
          more = fp.map(fp.prop('id'), more).concat(id || []);
          query = { _id: { $in: more } };
        }
        // by object foreignId
        else if (more[0].foreignId && more[0].time) {
          // remove all activities in the feed with the provided foreignId/time
          query = { $or: fp.map(fp.pick(['foreignId', 'time']), more) };
        }
        // by string id
        else {
          more = fp.concat(more, id || []);
          query = { _id: { $in: more } };
        }
        return super.remove(null, { query, $multi: true });
      }
    } else {
      return super.remove(id, params);
    }
  }
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;
