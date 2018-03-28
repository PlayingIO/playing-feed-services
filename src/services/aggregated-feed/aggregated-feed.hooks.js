import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import AggregatedFeedEntity from '~/entities/aggregated-feed.entity';

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
        cache(options.cache),
        hooks.presentEntity(AggregatedFeedEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}