import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import NotificationFeedEntity from '../../entities/notification-feed.entity';

export default function (options = {}) {
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
}