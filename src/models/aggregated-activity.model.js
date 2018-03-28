const options = {
  timestamps: true
};

/**
 * Structure to store aggregated activities
 */
const fields = {
  feed: { type: String, required: true },     // aggregate feed group
  group: { type: String, required: true },    // aggregate group
  actors: [{ type: String, required: true }], // distinct actors (cache)
  verbs: { type: String, required: true },    // distinct verbs (cache)
  objects: { type: String, required: true },  // distinct objects (cache)
  activities: [{ type: 'ObjectId' }],         // aggregated activities
  seenAt: { type: Date },                     // user opened/browsed the activity
  readAt: { type: Date }                      // user engaged with the activity
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ createdAt: -1, foreignId: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;