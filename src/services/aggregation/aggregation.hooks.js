const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

const AggregationEntity = require('../../entities/aggregation.entity');

module.exports = function (options = {}) {
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
};