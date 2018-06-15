import Entity from 'mostly-entity';

const ActivityEntity = new Entity('Activity');

ActivityEntity.excepts('_id');

export default ActivityEntity.asImmutable();
