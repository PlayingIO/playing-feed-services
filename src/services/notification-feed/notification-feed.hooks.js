const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

const NotificationFeedEntity = require('../../entities/notification-feed.entity');

module.exports = function (options = {}) {
  return {
    before: {
      all: []
    },
    after: {
      all: [
        hooks.presentEntity(NotificationFeedEntity, options.entities),
        hooks.responder()
      ]
    }
  };
};