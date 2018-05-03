import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

export default function (options = {}) {
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
}