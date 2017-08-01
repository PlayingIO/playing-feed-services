import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

const options = {
  discriminatorKey: 'type'
};

/*
 * feed group that user can follow
 */

const fields = {
  group: { type: 'String', required: true },
  realtime: { type: 'Boolean', default: true }
};

export default function(app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(timestamps);
  return mongoose.model(name, schema);
}