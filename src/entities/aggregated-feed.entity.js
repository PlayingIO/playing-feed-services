import Entity from 'mostly-entity';

const AggregatedFeedEntity = new Entity('AggregatedFeed');

AggregatedFeedEntity.discard('_id');

export default AggregatedFeedEntity.asImmutable();
