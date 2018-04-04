import activity from './activity.model';
import { addMany, removeMany } from './helpers';

const options = {
  strict: false
};

/**
 * Aggregated activity
 */
const fields = {
  actors: [{ type: String, required: true }],  // distinct actors (cache)
  objects: [{ type: String, required: true }], // distinct objects (cache)
  activities: [activity.schema],               // aggregated activities
  group: { type: String, required: true },     // group by aggregation format result
  seenAt: { type: Date },                      // user opened/browsed the activity
  readAt: { type: Date }                       // user engaged with the activity
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const ActivityModel = mongoose.model('activity');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ feed: 1, group: 1, verb: 1 });

  schema.statics.addMany = addMany(mongoose, name);
  schema.statics.removeMany = removeMany(mongoose, name);

  return ActivityModel.discriminator(name, schema);
}

model.schema = fields;