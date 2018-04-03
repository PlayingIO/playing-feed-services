const options = {
  timestamps: true,
  discriminatorKey: 'type',
  strict: false
};

/**
 * Activity tells the story of a person performing an action on or with an object.
 *
 * [Activity Streams Specification 1.0](http://activitystrea.ms/specs/json/1.0/)
 */
const fields = {
  feed: { type: String, required: true },      // feed group id
  actor: { type: String, required: true },     // actor performing the activity
  verb: { type: String, required: true },      // verb of the activity, i.e. loved, liked, followed
  object: { type: String },                    // object of the activity is related to
  target: { type: String },                    // optional target where the activity is belongs to, i.e. Surf board
  type: { type: String, default: 'activity' }, // discriminator key
  cc: [{ type: String} ],                      // list of feeds to be copied
  foreignId: { type: String },                 // unique ID for update this activity later (createdAt + foreignId)
  source: { type: String },                    // source feed of followship
  popularity: { type: Number, default: 1 },    // ranking of the activity
  // other free form fields as needed
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ createdAt: -1, foreignId: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;