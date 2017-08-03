import makeDebug from 'debug';
import fp from 'ramda';

const debug = makeDebug('playing:interaction-services:activities:subscriptions:document-events');

export default function(app, activities) {
  const feeds = app.service('feeds');
  app.trans.add({
    pubsub$: true,
    topic: 'playing.events',
    cmd: 'favorite.added'
  }, (resp) => {
    const favorite = resp.event;
    const creator = favorite && favorite.creator;
    debug('favorite.added', favorite);
    if (favorite && creator) {
      return fp.map((document) => {
        feeds.get(`document:${document}`).then((feed) => {
          if (feed) {
            activities.create({
              feed: feed.id,
              actor: `user:${creator.id}`,
              verb: 'addedToFavorites',
              object: `document:${document}`,
              foreignId: favorite.id,
              message: 'favorite the document',
              cc: [`user:${creator.id}`]
            });
          }
        });
      }, [].concat(favorite.document));
    }
  });
}

