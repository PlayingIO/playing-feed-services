import { plugins } from 'mostly-feathers-mongoose';

/*
 * activity log to track user interactions
 */
const options = {
  timestamps: true,
  strict: false
};

const fields = {
  feed: { type: String, required: true },   // feed group
  actor: { type: String, required: true },  // actor performing the activity
  verb: { type: String, required: true },   // verb of the activity
  object: { type: String, required: true }, // object of the activity
  target: { type: String },                 // optional target of the activity
  cc: [{ type: String} ],                   // list of feeds to be copied
  foreignId: { type: String },              // unique ID for update this activity later (createdAt + foreignId)
  // other free form fields as needed
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ createdAt: -1, foreignId: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;