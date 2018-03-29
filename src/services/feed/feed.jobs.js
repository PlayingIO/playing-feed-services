import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';
import { addActivities, removeActivities, followMany, unfollowMany } from '../../helpers';

const debug = makeDebug('playing:feed-services:feed:jobs');

export default function (app, options) {
  const agenda = app.agenda;
  const lockLifetime = options.agenda && options.agenda.lockLifetime ||  60 * 1000;
  assert(agenda, 'agenda not configured properly, check your app');
  
  // follow many feeds
  agenda.define('feed_follow_many', { lockLifetime }, function (job, next) {
    debug('>>> feed_follow_many', job.attrs.data);
    const { feed, targets, limit } = job.attrs.data;
    if (feed && targets && limit && targets.length > 0) {
      followMany(app, feed, targets, limit).then(next);
    } else {
      console.error('feed_follow_many job is not provided:', job.attrs.data);
      next();
    }
  });

  // unfollow many feeds
  agenda.define('feed_unfollow_many', { lockLifetime }, function (job, next) {
    debug('>>> feed_unfollow_many', job.attrs.data);
    const { feed, sources } = job.attrs.data;
    if (feed && sources && sources.length > 0) {
      unfollowMany(app, feed, sources).then(next);
    } else {
      console.error('feed_unfollow_many job is not provided:', job.attrs.data);
      next();
    }
  });

  // fanout the operations to target feeds
  agenda.define('fanout_operation', { lockLifetime }, function (job, next) {
    debug('>>> fanout_operation', job.attrs.data);
    const { operation, targets, activities } = job.attrs.data;
    if (operation && targets && activities && targets.length > 0 && activities.length > 0) {
      const operations = fp.map(feed => {
        switch (operation) {
          case 'addActivities': return addActivities(app, feed, activities);
          case 'removeActivities': return removeActivities(app, feed, activities);
          default: Promise.resolve();
        }
      }, targets);
      Promise.all(operations).then(next);
    } else {
      console.error('fanout_operation job is not provided:', job.attrs.data);
      next();
    }
  });
}