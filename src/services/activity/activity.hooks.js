import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import ActivityEntity from '~/entities/activity.entity';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
      ],
      update: [
        hooks.discardFields('id', 'createdAt', 'updatedAt')
      ],
      patch: [
        hooks.discardFields('id', 'createdAt', 'updatedAt')
      ]
    },
    after: {
      all: [
        hooks.populate('actor', { retained: true }),
        hooks.populate('object', { retained: false }),
        hooks.populate('target', { retained: false }),
        cache(options.cache),
        hooks.presentEntity(ActivityEntity, options),
        hooks.responder()
      ]
    }
  };
}