import Entity from 'mostly-entity';

const AggregatedFeedEntity = new Entity('AggregatedFeed');

AggregatedFeedEntity.excepts('updatedAt', 'destroyedAt');

export default AggregatedFeedEntity.asImmutable();
