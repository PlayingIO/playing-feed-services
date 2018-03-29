import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

const debug = makeDebug('playing:feed-services:helpers');

export const getFeedService = (id) => {
  if (id.startsWith('aggregated')) return 'aggregated-feeds';
  if (id.startsWith('notification')) return 'notification-feeds';
  return 'flat-feeds';
};

export const followMany = async (app, feed, targets, limit) => {
  const svcFeeds = app.service(getFeedService(feed));
  const svcActivities = app.service('activities');

  let activities = await Promise.all(fp.map((target) => svcActivities.find({
    query: { feed: target, $limit: limit },
    paginate: false
  }), targets));
  activities = fp.map(fp.renameKeys({ feed: 'source' }),
    fp.reject(fp.isNil, fp.flatten(activities)));
  if (activities.length > 0) {
    return svcFeeds.action('addMany').patch(feed, activities);
  }
};

export const unfollowMany = async (app, feed, sources) => {
  const svcFeeds = app.service(getFeedService(feed));
  const svcActivities = app.service('activities');

  // TODO agenda do not support async, callback will break after await
  //const trim = await svcFeeds.action('trim').remove(feed);  // trim first

  let activities = await svcActivities.find({
    query: { feed },
    paginate: false
  });
  activities = fp.filter(activity => fp.contains(activity.source, sources), activities);
  if (activities.length > 0) {
    return svcFeeds.action('removeMany').patch(feed, activities);
  }
};