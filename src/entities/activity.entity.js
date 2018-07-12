const Entity = require('mostly-entity');

const ActivityEntity = new Entity('Activity');

ActivityEntity.discard('_id');

module.exports = ActivityEntity.freeze();
