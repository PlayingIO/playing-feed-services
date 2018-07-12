const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

const ActivityEntity = require('../../entities/activity.entity');

module.exports = function (options = {}) {
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
        hooks.populate('actor', { retained: false }),
        hooks.populate('object', { retained: false }),
        hooks.populate('target', { retained: false }),
        cache(options.cache),
        hooks.presentEntity(ActivityEntity, options.entities),
        hooks.responder()
      ]
    }
  };
};