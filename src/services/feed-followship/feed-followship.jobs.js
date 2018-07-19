const assert = require('assert');
const makeDebug = require('debug');
const fp = require('mostly-func');
const { followMany, unfollowMany } = require('../../helpers');

const debug = makeDebug('playing:feed-services:feeds/followships:jobs');

module.exports = function (app, options) {
  const agenda = app.agenda;
  const lockLifetime = options.agenda && options.agenda.lockLifetime || 300 * 1000;
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
};