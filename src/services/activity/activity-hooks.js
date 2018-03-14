import { hooks } from 'mostly-feathers-mongoose';
import ActivityEntity from '~/entities/activity-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options)
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
        hooks.presentEntity(ActivityEntity, options),
        hooks.responder()
      ]
    }
  };
};