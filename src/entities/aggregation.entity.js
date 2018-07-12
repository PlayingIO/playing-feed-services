const Entity = require('mostly-entity');

const AggregationEntity = new Entity('Aggregation');

AggregationEntity.discard('_id');

module.exports = AggregationEntity.freeze();
