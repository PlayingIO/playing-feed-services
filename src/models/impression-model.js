import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

/*
 * track which activities are shown to the user
 */

const options = {
  strict: false
};

const fields = {
  content: { type: 'Mixed', required: true }, // content looking at
  feed: { type: 'ObjectId' },                 // feed looking at
  location: { type: 'String' },               // location in your app
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(timestamps);
  return mongoose.model(name, schema);
}

model.schema = fields;