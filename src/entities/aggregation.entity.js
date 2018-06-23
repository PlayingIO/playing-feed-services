import Entity from 'mostly-entity';

const AggregationEntity = new Entity('Aggregation');

AggregationEntity.discard('_id');

export default AggregationEntity.freeze();
