import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import { plural } from 'pluralize';
import fp from 'ramda';
import ActivityModel from '~/models/activity-model';
import defaultHooks from './activity-hooks';

const debug = makeDebug('playing:interaction-services:activities');

const defaultOptions = {
  name: 'activities'
};

class ActivityService extends Service {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
    this._subDocumentEvents();
  }

  _subDocumentEvents() {
    const feeds = this.app.service('feeds');
    this.app.trans.add({
      pubsub$: true,
      topic: 'playing.events',
      cmd: 'document.create'
    }, (resp) => {
      const document = resp.event;
      const creator = document && document.creator;
      debug('document.create', document);
      if (document && creator) {
        feeds.get(`document:${document.id}`).then((feed) => {
          if (feed) {
            this.create({
              feed: feed.id,
              actor: `user:${creator.id}`,
              verb: 'created',
              object: `document:${document.id}`,
              message: 'created the document',
              cc: [`user:${creator.id}`]
            });
          }
        });
      }
    });
  }

  create(data, params) {
    const feeds = this.app.service('feeds');
    return super.create(fp.omit(['cc'], data), params)
      .then((activity) => {
        if (data.cc && data.cc.length > 0) {
          return Promise.all(data.cc.map((cc) => {
            return feeds.get(cc).then((feed) => {
              if (feed) {
                data = fp.compose(
                  fp.assoc('feed', feed.id),
                  fp.omit(['cc'])
                )(data);
                return this.create(data);
              }
            });
          }));
        }
      });
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'activity' }, options);
  return createService(app, ActivityService, ActivityModel, options);
}

init.Service = ActivityService;
