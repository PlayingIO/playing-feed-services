import { plugins } from 'mostly-feathers-mongoose';

const options = {
  timestamps: true,
  discriminatorKey: 'type'
};

/**
 * Feed group that user can follow
 */
const fields = {
  id: { type: String, required: true, unique: true }, // group+target
  group: { type: String, required: true },            // feed group name
  target: { type: String, required: true },           // target id
  realtime: { type: Boolean, default: true }          // enable realtime notifications
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ group: 1, target: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;