import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

/*
 * feed group that user can follow
 */

const options = {
  discriminatorKey: 'type'
};

const fields = {
  id: { type: 'String', required: true, unique: true  }, // group+target
  group: { type: 'String', required: true }, // feed group name
  target: { type: 'String', required: true }, // target id
  realtime: { type: 'Boolean', default: true }
};

export default function(app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(timestamps);
  schema.index({ group: 1, target: 1 }, { unique: true });
  return mongoose.model(name, schema);
}