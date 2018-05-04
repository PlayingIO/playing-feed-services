import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';
import { addActivities, removeActivities } from '../../helpers';

const debug = makeDebug('playing:feed-services:feed:jobs');

export default function (app, options) {
  const agenda = app.agenda;
  const lockLifetime = options.agenda && options.agenda.lockLifetime || 300 * 1000;
  assert(agenda, 'agenda not configured properly, check your app');

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