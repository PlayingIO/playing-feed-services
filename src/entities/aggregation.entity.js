import Entity from 'mostly-entity';

const AggregationEntity = new Entity('Aggregation');

AggregationEntity.excepts('_id');

export default AggregationEntity.asImmutable();
