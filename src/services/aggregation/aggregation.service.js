import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import AggregationModel from '../../models/aggregation.model';
import defaultHooks from './aggregation.hooks';
import { validateUpdateActivity } from '../../helpers';

const debug = makeDebug('playing:feed-services:aggregations');

const defaultOptions = {
  name: 'aggregations',
  maxAggregatedLength: 15 // max number of aggregated activities in an Aggragation
};

export class AggregationService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
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
      assert(item.group, 'group is not provided');
      assert(item.object && item.object.indexOf(':undefined') === -1, 'object is undefined');
    };
    data = fp.asArray(data);
    fp.forEach(validator, data);

    const counters = await this.Model.addActivities(data, params.$rank, this.options.maxAggregatedLength);
    debug('aggregation addActivities', counters);
    return counters;
  }

  /**
   * Update an activity or many activities in bulk
   */
  async update (id, data, params) {
    // bulk update sub activities with data array
    if (fp.isArray(data)) {
      fp.forEach(validateUpdateActivity, data);
      return this.Model.updateActivities(data);
    }
    // update one sub activity with foreignId/time
    if (params.query.foreignId && params.query.time) {
      data.foreignId = params.query.foreignId;
      data.time = params.query.time;
      return this.Model.updateActivities([data]);
    }
    if (id) {
      const root = await this.get(id);
      if (root) {
        // update root aggreagtion
        return super.update(id, data, params);
      } else {
        // update one sub activity with id
        data.id = id;
        return this.Model.updateActivities([data]);
      }
    } else {
      return super.update(id, data, params);
    }
  }

  /**
   * Patch an activity or many activities in bulk
   */
  async patch (id, data, params) {
    // bulk update sub activities with data array
    if (fp.isArray(data)) {
      fp.forEach(validateUpdateActivity, data);
      return this.Model.updateActivities(data);
    }
    // update one sub activity with foreignId/time
    if (params.query.foreignId && params.query.time) {
      data.foreignId = params.query.foreignId;
      data.time = params.query.time;
      return this.Model.updateActivities([data]);
    }
    if (id) {
      const root = await this.get(id);
      if (root) {
        // update root aggreagtion
        return super.patch(id, data, params);
      } else {
        // update one sub activity with id
        data.id = id;
        return this.Model.updateActivities([data]);
      }
    } else {
      return super.patch(id, data, params);
    }
  }

  /**
   * Remove an activity or many activities in bulk
   */
  async remove (id, params) {
    params = { query: {}, ...params };
    assert(id || params.query.more, 'id or more is not provided.');

    if (params.query.more) {
      let more = fp.splitOrArray(params.query.more);
      if (more.length > 0) {
        // by object id
        if (more[0].id) {
          more = fp.map(fp.prop('id'), more).concat(id || []);
          return this.Model.removeActivities(fp.map(id => ({ id }), more));
        }
        // by object foreignId/time
        else if (more[0].foreignId && more[0].time) {
          // remove all activities in the feed with the provided foreignId/time
          return this.Model.removeActivities(more);
        }
        // by string id
        else {
          more = fp.concat(more, id || []);
          return this.Model.removeActivities(fp.map(id => ({ id }), more));
        }
      }
    } else {
      return this.Model.removeActivities([{ id }]);
    }
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({
    ModelName: 'aggregation',
    maxAggregatedLength: defaultOptions.maxAggregatedLength
  }, options);
  return createService(app, AggregationService, AggregationModel, options);
}

init.Service = AggregationService;
