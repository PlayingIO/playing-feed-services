import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import ActivityEntity from '~/entities/activity-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        auth.authenticate('jwt')
      ],
      get: [],
      find: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    after: {
      all: [
        hooks.populate('actor', { retained: true }),
        hooks.populate('object', { retained: false }),
        hooks.populate('target', { retained: false }),
        hooks.presentEntity(ActivityEntity, options),
        hooks.responder()
      ]
    }
  };
};