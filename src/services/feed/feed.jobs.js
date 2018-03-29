import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';
import { addOperation, removeOperation, followMany, unfollowMany } from '../../helpers';

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
    }
  });

  // fanout the operations
  agenda.define('fanout_operation', { lockLifetime }, function (job, next) {
    debug('>>> fanout_operation', job.attrs.data);
    const { feed, targets } = job.attrs.data;
    if (feed && targets && targets.length > 0) {
      const svcFeedManager = app.service('feeds');
      svcFeedManager.action('fanout').patch(feed, { targets }).then(next);
    } else {
      console.error('fanout_operation job is not provided:', job.attrs.data);
    }
  });
}