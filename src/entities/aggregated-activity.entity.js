import Entity from 'mostly-entity';

const AggregatedActivityEntity = new Entity('AggregatedActivity');

AggregatedActivityEntity.excepts('updatedAt', 'destroyedAt');

export default AggregatedActivityEntity.asImmutable();
