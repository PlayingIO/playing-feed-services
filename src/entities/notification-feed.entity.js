import Entity from 'mostly-entity';

const NotificationFeedEntity = new Entity('NotificationFeed');

NotificationFeedEntity.excepts('_id');

export default NotificationFeedEntity.asImmutable();
