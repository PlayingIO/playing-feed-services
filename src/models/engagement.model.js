const options = {
  timestamps: true,
  strict: false
};

/**
 * track which activities user engaged with
 */
const fields = {
  event: { type: String, required: true },    // type of event, ie click, share, search
  content: { type: 'Mixed', required: true }, // content related to
  position: { type: String },                 // position in a list of activities
  boost: { type: String },                    // boost factor
  feed: { type: 'ObjectId' },                 // feed looking at
  location: { type: String },                 // location in your app
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  return mongoose.model(name, schema);
}

model.schema = fields;