import assert from 'assert';
import makeDebug from 'debug';
import fp from 'mostly-func';

const debug = makeDebug('playing:feed-services:feed:jobs');

export default function (app, options) {
  const agenda = app.agenda;
  assert(agenda, 'agenda not configured properly, check your app');

  // follow many feeds
  agenda.define('feed_follow_many', async function (job, next) {
    debug('>>> feed_follow_many', job.attrs.data);
    const { feed, targets, limit } = job.attrs.data;
    if (feed && targets && limit && targets.length > 0) {
      const svcFeeds = app.service('feeds');
      const svcActivities = app.service('activities');

      let activities = await Promise.all(fp.map((target) => svcActivities.find({
        query: { feed: target, $limit: limit },
        paginate: false
      }), targets));
      activities = fp.map(fp.renameKeys({ feed: 'source' }), fp.flatten(activities));
      if (activities.length > 0) {
        await svcFeeds.action('addMany').patch(feed, activities);
      }
      next();
    } else {
      console.error('feed_follow_many job is not provided:', job.attrs.data);
    }
  });

  // unfollow many feeds
  agenda.define('feed_unfollow_many', async function (job, next) {
    debug('>>> feed_unfollow_many', job.attrs.data);
    const { feed, sources } = job.attrs.data;
    if (feed && sources && sources.length > 0) {
      const svcFeeds = app.service('feeds');
      const svcActivities = app.service('activities');

      await svcFeeds.action('trim').patch(feed); // trim first
 
      let activities = await svcActivities.find({
        query: { feed },
        paginate: false
      });
      activities = fp.filter(activity => fp.contains(activity.source, sources), activities);
      if (activities.length > 0) {
        await svcFeeds.action('removeMany').patch(feed, activities);
      }
      next();
    } else {
      console.error('feed_unfollow_many job is not provided:', job.attrs.data);
    }
  });
}