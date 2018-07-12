const Entity = require('mostly-entity');

const FlatFeedEntity = new Entity('FlatFeed');

FlatFeedEntity.discard('_id');

module.exports = FlatFeedEntity.freeze();
