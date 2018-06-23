import Entity from 'mostly-entity';

const NotificationFeedEntity = new Entity('NotificationFeed');

NotificationFeedEntity.discard('_id');

export default NotificationFeedEntity.freeze();
