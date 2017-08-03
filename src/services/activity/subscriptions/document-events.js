import makeDebug from 'debug';

const debug = makeDebug('playing:interaction-services:activities:subscriptions:document-events');

export default function(app, activities) {
  const feeds = app.service('feeds');
  app.trans.add({
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
          activities.create({
            feed: feed.id,
            actor: `user:${creator.id}`,
            verb: 'documentCreated',
            object: `document:${document.id}`,
            foreignId: document.id,
            message: 'created the document',
            title: document.title,
            cc: [`user:${creator.id}`]
          });
        }
      });
    }
  });
}

