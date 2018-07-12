const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

module.exports = function (options = {}) {
  return {
    before: {
      all: []
    },
    after: {
      all: [
        hooks.responder()
      ]
    }
  };
};