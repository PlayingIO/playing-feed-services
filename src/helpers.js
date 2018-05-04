import dateFn from 'date-fns';
import fp from 'mostly-func';
import { formatter } from 'mostly-utils-common';

export const getFeedType = (id) => {
  if (id.startsWith('aggregated')) return 'aggregated';
  if (id.startsWith('notification')) return 'notification';
  return 'flat';
};

export const getFeedService = (id) => {
  const type = getFeedType(id);
  return `${type}-feeds`;
};

export const getFeedActivityService = (id) => {
  const type = getFeedType(id);
  return `${type}-feeds/activities`;
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

/**
 * add and copy activities to feeds
 */
export const addActivity = async (app, activity, ...feeds) => {
  const svcFeedsActivities = app.service('feeds/activities');

  feeds = fp.flatten(feeds);
  const first = fp.head(feeds), tail = fp.tail(feeds);

  // carbon copy to tail feeds
  activity.cc = (activity.cc || []).concat(tail);
  return svcFeedsActivities.create(activity, { primary: first });
};

/**
 * Add activities to feed
 */
export const addActivities = (app, feed, activities) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  if (activities.length > 0) {
    return svcFeedsActivities.create(activities, { primary: feed });
  }
};

/**
 * Remove activities from feed
 */
export const removeActivities = (app, feed, activities) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  if (activities.length > 0) {
    return svcFeedsActivities.remove(null, { more: activities, primary: feed });
  }
};

/**
 * Add activities from following target feeds
 */
export const followMany = async (app, feed, targets, limit) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  const svcActivities = app.service('activities');

  let activities = await Promise.all(fp.map((target) => svcActivities.find({
    query: { feed: target, $limit: limit },
    paginate: false
  }), targets));
  activities = fp.reject(fp.isNil, fp.flatten(activities));
  activities = fp.map(fp.pipe(
    fp.renameKeys({ feed: 'source' }),
    fp.dissoc('id')
  ), activities);
  if (activities.length > 0) {
    return svcFeedsActivities.create(activities, { primary: feed });
  }
};

/**
 * Remove activities from unfollowed source feeds
 */
export const unfollowMany = async (app, feed, sources) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  const svcActivities = app.service('activities');

  // TODO agenda do not support async, callback will break after await
  //const trim = await svcFeeds.action('trim').remove(feed);  // trim first

  let activities = await svcActivities.find({
    query: { feed },
    paginate: false
  });
  activities = fp.filter(activity => fp.contains(activity.source, sources), activities);
  if (activities.length > 0) {
    return svcFeedsActivities.remove(null, { more: activities, primary: feed });
  }
};

/**
 * trim the feed activities
 */
export const trimFeedActivities = async (app, feed) => {
  const svcActivities = app.service('activities');
  if (feed && feed.maxLength) {
    const maxActivity = await svcActivities.find({
      query: { feed: feed.id, $select: 'id', $skip: feed.maxLength - 1, $limit: 1 },
      paginate: false
    });
    if (maxActivity && maxActivity.length > 0) {
      return svcActivities.remove(null, { query: {
        feed: feed.id,
        _id: { $lt: maxActivity[0].id },
        $multi: true
      }});
    }
  }
};