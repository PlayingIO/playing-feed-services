import Entity from 'mostly-entity';

const ActivityEntity = new Entity('Activity');

ActivityEntity.discard('_id');

export default ActivityEntity.freeze();
