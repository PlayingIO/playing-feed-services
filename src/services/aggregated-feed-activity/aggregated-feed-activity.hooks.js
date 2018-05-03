import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
      ],
      create: [
        hooks.primaryResource('feed', { service: 'feeds' })
      ],
      patch: [
        hooks.primaryResource('feed', { service: 'feeds' })
      ],
      remove: [
        hooks.primaryResource('feed', { service: 'feeds' })
      ]
    },
    after: {
      all: [
        cache(options.cache),
        hooks.responder()
      ]
    }
  };
}