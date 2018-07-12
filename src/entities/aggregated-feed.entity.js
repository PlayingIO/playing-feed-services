const Entity = require('mostly-entity');

const AggregatedFeedEntity = new Entity('AggregatedFeed');

AggregatedFeedEntity.discard('_id');

module.exports = AggregatedFeedEntity.freeze();
