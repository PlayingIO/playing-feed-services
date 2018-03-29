import Entity from 'mostly-entity';

const FlatFeedEntity = new Entity('FlatFeed');

FlatFeedEntity.excepts('updatedAt', 'destroyedAt');

export default FlatFeedEntity.asImmutable();
