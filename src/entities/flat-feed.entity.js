import Entity from 'mostly-entity';

const FlatFeedEntity = new Entity('FlatFeed');

FlatFeedEntity.excepts('_id');

export default FlatFeedEntity.asImmutable();
