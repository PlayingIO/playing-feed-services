import { errors } from 'feathers-errors';
import fp from 'mostly-func';

import { addActivity } from '../helpers';

export default function notify (event, notifies) {
  return async context => {
    if (notifies[event]) {
      const [activity, ...feeds] = notifies[event](context);
      if (activity && fp.isNotEmpty(feeds)) {
        await addActivity(context.app, activity, feeds);
        return context;
      }
    } else {
      throw new Error('No such notifer found for ' + event);
    }
  };
}
