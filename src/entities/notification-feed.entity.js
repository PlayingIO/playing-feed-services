import Entity from 'mostly-entity';

const NotificationFeedEntity = new Entity('NotificationFeed');

NotificationFeedEntity.excepts('updatedAt', 'destroyedAt');

export default NotificationFeedEntity.asImmutable();
