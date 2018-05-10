import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import AggregationEntity from '../../entities/aggregation.entity';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
      ],
      update: [
        hooks.discardFields('activities', 'createdAt', 'updatedAt')
      ],
      patch: [
        hooks.discardFields('activities', 'createdAt', 'updatedAt')
      ]
    },
    after: {
      all: [
        hooks.populate('activities.actor', { retained: false }),
        hooks.populate('activities.object', { retained: false }),
        hooks.populate('activities.target', { retained: false }),
        cache(options.cache),
        hooks.presentEntity(AggregationEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}