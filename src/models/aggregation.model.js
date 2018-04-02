import activity from './activity.model';

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
  seenAt: { type: Date },                      // user opened/browsed the activity
  readAt: { type: Date }                       // user engaged with the activity
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const ActivityModel = mongoose.model('activity');
  const schema = new mongoose.Schema(fields, options);
  return ActivityModel.discriminator(name, schema);
}

model.schema = fields;