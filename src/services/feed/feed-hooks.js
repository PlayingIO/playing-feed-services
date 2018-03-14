import { hooks } from 'mostly-feathers-mongoose';

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
        hooks.responder()
      ]
    }
  };
};