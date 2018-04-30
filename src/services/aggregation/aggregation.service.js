import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import AggregationModel from '../../models/aggregation.model';
import defaultHooks from './aggregation.hooks';

const debug = makeDebug('playing:feed-services:aggregations');

const defaultOptions = {
  name: 'aggregations',
  maxAggregatedLength: 15 // max number of aggregated activities in an Aggragation
};

export class AggregationService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
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
      assert(item.group, 'group is not provided');
      assert(item.object && item.object.indexOf(':undefined') === -1, 'object is undefined');
    };
    if (fp.is(Array, data)) {
      assert(data.length, 'cannot create empty array of activities.');
    } else {
      data = [data];
    }
    fp.forEach(validator, data);

    const counters = await this.Model.addActivities(data, params.$rank, this.options.maxAggregatedLength);
    debug('aggregation addActivities', counters);
    return counters;
  }

  async patch (id, data, params) {
    let results = null;
    if (!id || data.activities) {
      let activities = fp.is(Array, data) ? data : (data.activities || [data]);
      activities = fp.filter(fp.anyPass([
        fp.has('_id'),
        fp.has('id'),
        fp.has('foreignId')
      ]), activities);
      assert(activities.length, 'cannot patch empty array of aggregation activities');
      results =  await this.Model.updateActivities(activities);
      delete data.activities;
    }

    if (id) {
      return super.patch(id, data, params);
    } else {
      return results;
    }
  }

  async remove (id, params) {
    params = fp.assign({ query: {} }, params);
    assert(id || params.query.more, 'id or more is not provided.');

    if (params.query.more) {
      let more = fp.splitOrArray(params.query.more);
      if (more.length > 0) {
        // by object id
        if (more[0].id) {
          more = fp.map(fp.prop('id'), more).concat(id || []);
          return this.Model.removeActivities(fp.map(id => ({ id }), more));
        }
        // by object foreignId
        else if (more[0].foreignId) {
          // remove all activities in the feed with the provided foreignId
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
