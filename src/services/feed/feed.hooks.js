const { iff } = require('feathers-hooks-common');
const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');

module.exports = function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
      ]
    },
    after: {
      all: [
        iff(hooks.isAction('activites'),
          hooks.populate('actor', { retained: false }),
          hooks.populate('object', { retained: false }),
          hooks.populate('target', { retained: false })
        ),
        cache(options.cache),
        hooks.responder()
      ]
    }
  };
};