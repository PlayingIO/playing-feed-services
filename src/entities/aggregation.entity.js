import Entity from 'mostly-entity';

const AggregationEntity = new Entity('Aggregation');

AggregationEntity.excepts('updatedAt', 'destroyedAt');

export default AggregationEntity.asImmutable();
