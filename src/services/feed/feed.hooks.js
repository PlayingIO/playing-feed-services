import { iff } from 'feathers-hooks-common';
import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

export default function (options = {}) {
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
}