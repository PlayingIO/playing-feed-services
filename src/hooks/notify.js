import makeDebug from 'debug';
import { errors } from 'feathers-errors';
import fp from 'mostly-func';

import { addActivity } from '../helpers';

const debug = makeDebug('playing:feed-services:hooks:notify');

export default function notify (event, notifiers) {
  return async context => {
    if (notifiers[event]) {
      const notifer = notifiers[event](context);
      if (notifer) {
        const [activity, ...feeds] = notifer;
        if (activity && fp.isNotEmpty(feeds)) {
          await addActivity(context.app, activity, feeds);
          return context;
        }
      } else {
        debug(`Skip notifer '${event}' of service ${context.service.name}`);
      }
    } else {
      throw new Error('No such notifer found for ' + event);
    }
  };
}
