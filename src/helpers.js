import dateFn from 'date-fns';
import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { formatter } from 'mostly-utils-common';

const debug = makeDebug('playing:feed-services:helpers');

export const getFeedService = (id) => {
  if (id.startsWith('aggregated')) return 'aggregated-feeds';
  if (id.startsWith('notification')) return 'notification-feeds';
  return 'flat-feeds';
};

/**
 * Apply the aggregation format, available variables:
 *  ${verb}, ${time}, ${object}, ${target}, ${id}, ${actor}, ${feed}
 */
export const formatAggregation = (format, activity) => {
  const variables = fp.assign(activity, {
    time: dateFn.format(activity.createdAt || new Date(), 'YYYY-MM-DD'),
  });
  return formatter(format, variables);
};

const groupByPriority = fp.groupBy(followship => {
  const priority = followship.priority || 10;
  return priority <= 0? 'lowest' :
         priority < 20? 'low' :
         priority < 50? 'normal' :
         priority < 80? 'high' : 'highest';
});

/**
 * Get follower feeds by chunks
 */
export const getFollowers = async (app, target, limit, skip) => {
  const svcFollowship = app.service('followships');
  const followships = await svcFollowship.find({
    query: { followee: target, $sort: { priority: -1 }, $limit: limit, $skip: skip },
    paginate: false
  });
  const groupedFollowships = groupByPriority(followships);
  return fp.mapObjIndexed((followers, priority) => {
    return fp.map(fp.prop('follower'), followers);
  }, groupedFollowships);
};

/**
 * Get followee feeds by chunks
 */
export const getFollowees = async (app, source, limit, skip) => {
  const svcFollowship = app.service('followships');
  const followships = await svcFollowship.find({
    query: { follower: source, $sort: { priority: -1 }, $limit: limit, $skip: skip },
    paginate: false
  });
  const groupedFollowships = groupByPriority(followships);
  return fp.mapObjIndexed((followees, priority) => {
    return fp.map(fp.prop('followee'), followees);
  }, groupedFollowships);
};

/**
 * Fanout activities to follower feeds by chunks
 */
export const fanoutOperations = async (app, feed, operation, activities, limit, skip = 0) => {
  const priorityFollowers = await getFollowers(app, feed, limit, skip);
  if (!fp.isEmpty(priorityFollowers)) {
    fp.forEachObjIndexed((followers, priority) => {
      app.agenda.now('fanout_operation', {
        operation, targets: followers, activities
      }).priority(priority);
    }, priorityFollowers);
    await fanoutOperations(app, feed, operation, activities, limit, skip + limit);
  }
};

export const addActivities = (app, feed, activities) => {
  const svcFeeds = app.service(getFeedService(feed));
  if (activities.length > 0) {
    return svcFeeds.action('addMany').patch(feed, activities);
  }
};

export const removeActivities = (app, feed, activities) => {
  const svcFeeds = app.service(getFeedService(feed));
  if (activities.length > 0) {
    return svcFeeds.action('removeMany').patch(feed, activities);
  }
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