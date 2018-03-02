import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

const options = {
  timestamps: true,
  strict: false
};

/*
 * track which activities are shown to the user
 */
const fields = {
  content: { type: 'Mixed', required: true }, // content looking at
  feed: { type: 'ObjectId' },                 // feed looking at
  location: { type: String },                 // location in your app
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  return mongoose.model(name, schema);
}

model.schema = fields;