import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';

const debug = makeDebug('playing:feed-services:feed:jobs');

export default function (app, options) {
  const agenda = app.agenda;
  assert(agenda, 'agenda not configured properly, check your app');

  // follow many user feeds
  agenda.define('feed_follow_many', async function (job, next) {
    debug('===== RUN feed_follow_many =====', job.attrs.data);
    const { user, targets, limit } = job.attrs.data;
    if (user && targets && limit) {
      const svcFeeds = app.service('feeds');
      const feed = await svcFeeds.get(`user:${user}`);
      const targetFeeds = await svcFeeds.get({
        query: {
          id: { $in: fp.map(fp.concat('user:'), targets) },
          $select: 'activities,*'
        },
        paginate: false
      });
      if (feed && targetFeeds.length > 0) {
        const activities = fp.flatMap(fp.prop('activities'), targetFeeds);
        await svcFeeds.action('addMany').patch(feed.id, activities);
        next();
      }
    } else {
      console.error('feed_follow_many job is not provided:', job.attrs.data);
    }
  });
}