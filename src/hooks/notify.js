import { errors } from 'feathers-errors';
import fp from 'mostly-func';

import { addActivity } from '../helpers';

export default function notify (event, notifiers) {
  return async context => {
    if (notifiers[event]) {
      const [activity, ...feeds] = notifiers[event](context);
      if (activity && fp.isNotEmpty(feeds)) {
        await addActivity(context.app, activity, feeds);
        return context;
      }
    } else {
      throw new Error('No such notifer found for ' + event);
    }
  };
}
