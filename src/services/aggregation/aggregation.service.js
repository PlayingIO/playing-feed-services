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
      assert(item.group, 'group is not provided');
      assert(item.object && item.object.indexOf(':undefined') === -1, 'object is undefined');
    };
    if (fp.is(Array, data)) {
      assert(data.length, 'cannot create empty array of activities.');
    } else {
      data = [data];
    }
    fp.forEach(validator, data);

    const counters = await this.Model.addMany(data, params.$rank, this.options.maxAggregatedLength);
    debug('aggregation addMany', counters);
    return counters;
  }

  async _udpateActivities (activities) {
    const items = fp.filter(fp.any(
      fp.has('_id'),
      fp.has('id'),
      fp.has('foreignId')
    ), activities);
    return this.Model.updateMany(items);
  }

  async update (id, data, params) {
    if (data.activities && data.activities.length > 0) {
      await this._udpateActivities(data.activities);
      delete data.activities;
    }

    return super.update(id, data, params);
  }

  async patch (id, data, params) {
    if (data.activities && data.activities.length > 0) {
      await this._udpateActivities(data.activities);
      delete data.activities;
    }

    return super.patch(id, data, params);
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
          return this.Model.removeMany(fp.map(id => ({ id }), more));
        }
        // by object foreignId
        else if (more[0].foreignId) {
          // remove all activities in the feed with the provided foreignId
          return this.Model.removeMany(more);
        }
        // by string id
        else {
          more = fp.concat(more, id || []);
          return this.Model.removeMany(fp.map(id => ({ id }), more));
        }
      }
    } else {
      return this.Model.removeMany([{ id }]);
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
