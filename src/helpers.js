import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

const debug = makeDebug('playing:feed-services:helpers');

export const createActivity = (app, service) => {
  const svcFeeds = app.service(service);
  const svcActivities = app.service('activities');

  return async (feed, activity) => {
    const feedGroup = await svcFeeds.get(feed);
    if (feedGroup) {
      activity.feed = feedGroup.id;
      return svcActivities.create(activity);
    }
  };
};