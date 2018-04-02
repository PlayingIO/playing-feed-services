import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import FlatFeedEntity from '../../entities/flat-feed.entity';

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
        hooks.assoc('activities', { service: 'activities', field: 'feed', limit: options.followLimit }),
        cache(options.cache),
        hooks.presentEntity(FlatFeedEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}