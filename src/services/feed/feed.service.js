import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import FeedModel from '~/models/feed.model';
import defaultHooks from './feed.hooks';
import defaultJobs from './feed.jobs';

const debug = makeDebug('playing:interaction-services:feeds');

const defaultOptions = {
  id: 'id',
  name: 'feeds',
  trimChance: 0.01 // the chance to trim the feed, not to grow to infinite size
};

class FeedService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    defaultJobs(app, this.options);
  }

  async get (id, params) {
    assert(id && id.indexOf(':') > 0, 'invalid feed id');
    if (params && params.__action) {
      return super._action('get', params.__action, id, null, params);
    }

    let [group, target] =  id.split(':');
    if (!target || target === 'undefined') {
      throw new Error('feed target is undefined');
    }
    return super._upsert(null, { id, group, target });
  }

  /**
   * Add an activity
   */
  async _addActivity (id, data, params, feed) {
    assert(feed, 'feed is not exists.');
    assert(data.actor && data.verb && data.object, 'activity is not provided.');
    data.feed = feed.id;

    const svcActivities = this.app.service('activities');
    await svcActivities.create(data);
    return feed;
  }

  /**
   * Add many activities in bulk
   */
  async _addMany (id, data, params, feed) {
    assert('data.target', 'data.target is not provided.');
    assert(feed, 'feed is not exists.');
    assert(fp.is(Array, data) && data.length > 0, 'data is an array or is empty.');
    data = fp.map(fp.assoc('feed', feed.id), data);

    const svcActivities = this.app.service('activities');
    await svcActivities.create(data);
    return feed;
  }

  async _removeActivity (id, data, params, feed) {
    assert('data.target', 'data.target is not provided.');
    assert(feed, 'feed is not exists.');
    assert(data.actvity || data.foreignId, 'activity or foreignId is not provided.');

    const svcActivities = this.app.service('activities');
    if (data.foreignId) {
      await svcActivities.remove(null, {
        query: { foreignId: data.foreignId },
        $multi: true
      });
    } else {
      await svcActivities.remove(data);
    }
    return feed;
  }

  async _activities (id, data, params, feed) {
    params = fp.assign({ query: {} }, params);
    assert(feed, 'feed is not exists.');
    params.query.feed = feed.id;

    return this.app.service('activities').find(params);
  }

  async _following (id, data, params, feed) {
    assert('data.target', 'data.target is not provided.');
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'feed' }, options);
  return createService(app, FeedService, FeedModel, options);
}

init.Service = FeedService;
