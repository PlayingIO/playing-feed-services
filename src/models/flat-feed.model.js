const options = {
  timestamps: true,
  discriminatorKey: 'type'
};

/**
 * Flat feed is the default feed type - and the only feed type that you can follow.
 *
 * Feed group name is used as discriminator key, so special group name like 'notification'
 * and 'aggregated' will be treated with as corresponding model. Other free-form group names
 * like 'user', 'timeline' are all flat feeds.
 *
 * It's not possible to follow either aggregated or notification feeds.
 */
const fields = {
  id: { type: String, required: true, unique: true }, // id as group + ':' + target
  group: { type: String, required: true },            // feed group name, like user, timeline with meanings
  target: { type: String, required: true },           // target id
  type: { type: String, default: 'flat' },            // discriminator key
  maxLength: { type: Number, default: 1000 },         // the max length of activities before trimming
  realtime: { type: Boolean, default: true }          // enable realtime notifications
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ id: 1 }, { unique: true });
  schema.index({ id: 1, group: 1, target: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;