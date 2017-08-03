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
        hooks.populate('actor'),
        hooks.populate('object'),
        hooks.populate('target'),
        hooks.presentEntity(ActivityEntity, options),
        hooks.responder()
      ]
    }
  };
};