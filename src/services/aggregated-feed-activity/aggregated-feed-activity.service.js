import assert from 'assert';
import makeDebug from 'debug';
import mongoose from 'mongoose';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import sift from 'sift';

import defaultHooks from './aggregated-feed-activity.hooks';
import { addActivities, formatAggregation, trimFeedActivities } from '../../helpers';

const debug = makeDebug('playing:mission-services:aggregated-feeds/activities');

const defaultOptions = {
  name: 'aggregated-feeds/activities'
};

export class AggregatedFeedActivityService {
  constructor (options) {
    this.options = fp.assign(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Add an activity or many activities in bulk
   */
  async create (data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');

    data = fp.map(item => {
      item.feed = feed.id,
      item.group = formatAggregation(feed.aggregation, item);
      return item;
    }, fp.asArray(data));

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.create(data, fp.assoc('$rank', feed.rank, params));

    // aggregated feed do not support cc at present,
    // often an activity is add to a flat feed and cc to an aggregated feed
    // so there maybe duplication when the aggregated feed is following the flat feed

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }

  /**
   * Update an actitity or many activities in bulk
   */
  async patch (id, data, params) {
    const feed = params.feed;
    assert(feed, 'feed is not provided');
    data = fp.asArray(data);

    const svcAggregations = this.app.service('aggregations');
    const results = await svcAggregations.patch(null, data, params);

    // trim the feed sometimes
    if (Math.random() <= this.options.trimChance) {
      await trimFeedActivities(this.app, feed);
    }
    return results;
  }
}

export default function init (app, options, hooks) {
  return new AggregatedFeedActivityService(options);
}

init.Service = AggregatedFeedActivityService;
