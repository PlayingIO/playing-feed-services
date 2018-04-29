import { errors } from 'feathers-errors';
import fp from 'mostly-func';

import { addActivity } from '../helpers';

export default function notify (event, notifies) {
  return context => {
    if (notifies[event]) {
      const [activity, ...feeds] = notifies[event](context);
      return addActivity(context.app, activity, feeds);
    } else {
      throw new Error('No such notifer found for ' + event);
    }
  };
}
