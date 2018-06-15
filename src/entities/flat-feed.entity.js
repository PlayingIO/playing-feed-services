import Entity from 'mostly-entity';

const FlatFeedEntity = new Entity('FlatFeed');

FlatFeedEntity.discard('_id');

export default FlatFeedEntity.asImmutable();
