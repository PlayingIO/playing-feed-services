const Entity = require('mostly-entity');

const NotificationFeedEntity = new Entity('NotificationFeed');

NotificationFeedEntity.discard('_id');

module.exports = NotificationFeedEntity.freeze();
