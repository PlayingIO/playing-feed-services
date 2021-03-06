const assert = require('assert');
const dateFn = require('date-fns');
const fp = require('mostly-func');
const { formatter } = require('mostly-utils-common');
const { getFeedType } = require('playing-feed-common');

const getFeedService = (id) => {
  const type = getFeedType(id);
  return `${type}-feeds`;
};

const getFeedActivityService = (id) => {
  const type = getFeedType(id);
  return `${type}-feeds/activities`;
};

/**
 * Apply the aggregation format, available variables:
 *  ${verb}, ${time}, ${object}, ${target}, ${id}, ${actor}, ${feed}
 */
const formatAggregation = (format, activity) => {
  const variables = { ...activity, time: dateFn.format(activity.time, 'YYYY-MM-DD') };
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
const getFollowers = async (app, target, limit, skip) => {
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
const getFollowees = async (app, source, limit, skip) => {
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
const fanoutActivities = async (app, feed, operation, activities, limit, skip = 0) => {
  // get batch of followers with skip/limit
  const priorityFollowers = await getFollowers(app, feed, limit, skip);
  if (!fp.isEmpty(priorityFollowers)) {
    fp.forEachObjIndexed((followers, priority) => {
      app.agenda.now('fanout_activities', {
        operation, targets: followers, activities
      }).priority(priority);
    }, priorityFollowers);
    // process next batch of followers
    await fanoutActivities(app, feed, operation, activities, limit, skip + limit);
  }
};

/**
 * validate activity with id/foreignId/time
 */
const validateUpdateActivity = (item) => {
  assert(item.id || (item.foreignId && item.time), 'id or foreignId/time is not provided.');
};

/**
 * Add activities to feed
 */
const addActivities = (app, feed, activities) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  if (activities.length > 0) {
    return svcFeedsActivities.create(activities, { primary: feed });
  }
};

/**
 * Remove activities from feed
 */
const removeActivities = (app, feed, activities) => {
  const svcFeedsActivities = app.service(getFeedActivityService(feed));
  if (activities.length > 0) {
    return svcFeedsActivities.remove(null, {
      primary: feed,
      query: { more: activities }
    });
  }
};

/**
 * Add activities from following target feeds
 */
const followMany = async (app, feed, targets, limit) => {
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
const unfollowMany = async (app, feed, sources) => {
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
 * Trim the feed activities
 */
const trimFeedActivities = async (app, feed) => {
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

module.exports = {
  addActivities,
  followMany,
  fanoutActivities,
  formatAggregation,
  getFeedService,
  getFeedActivityService,
  getFollowers,
  getFollowees,
  removeActivities,
  trimFeedActivities,
  unfollowMany,
  validateUpdateActivity
};