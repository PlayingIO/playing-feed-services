const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

const AggregatedFeedEntity = require('../../entities/aggregated-feed.entity');

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
        hooks.assoc('activities', { service: 'aggregations', field: 'feed', limit: options.followLimit }),
        cache(options.cache),
        hooks.presentEntity(AggregatedFeedEntity, options.entities),
        hooks.responder()
      ]
    }
  };
};