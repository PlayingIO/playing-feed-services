import Entity from 'mostly-entity';

const AggregatedFeedEntity = new Entity('AggregatedFeed');

AggregatedFeedEntity.excepts('_id');

export default AggregatedFeedEntity.asImmutable();
