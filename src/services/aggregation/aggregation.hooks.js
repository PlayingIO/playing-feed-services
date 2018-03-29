import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import AggregationEntity from '~/entities/aggregation.entity';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
      ],
      update: [
        hooks.discardFields('createdAt', 'updatedAt')
      ],
      patch: [
        hooks.discardFields('createdAt', 'updatedAt')
      ]
    },
    after: {
      all: [
        hooks.populate('actors', { retained: false }),
        hooks.populate('objects', { retained: false }),
        cache(options.cache),
        hooks.presentEntity(AggregationEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}