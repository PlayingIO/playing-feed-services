import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import FeedEntity from '~/entities/feed.entity';

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
        cache(options.cache),
        hooks.assoc('activities', { service: 'activities', field: 'feed', limit: 100 }),
        hooks.presentEntity(FeedEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}