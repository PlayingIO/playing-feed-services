import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

/*
 * activity log to track user interactions
 */
const options = {
  strict: false
};

const fields = {
  feed: { type: 'ObjectId', required: true }, // feed group
  actor: { type: 'String', required: true }, // actor performing the activity
  verb: { type: 'String', required: true }, // verb of the activity
  object: { type: 'String', required: true }, // object of the activity
  target: { type: 'String' }, // optional target
  cc: [{ type: 'ObjectId'} ], // list of feeds to be copied
  foreignId: { type: 'String' },
  // other free form fields as needed
};

export default function(app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(timestamps);
  schema.index({ createdAt: -1, foreignId: 1 }, { unique: true });
  return mongoose.model(name, schema);
}