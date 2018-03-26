import Entity from 'mostly-entity';

const FeedEntity = new Entity('Feed');

FeedEntity.excepts('updatedAt', 'destroyedAt');

export default FeedEntity.asImmutable();
