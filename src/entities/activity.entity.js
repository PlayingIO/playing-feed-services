import Entity from 'mostly-entity';

const ActivityEntity = new Entity('Activity');

ActivityEntity.excepts('updatedAt', 'destroyedAt');

export default ActivityEntity.asImmutable();
