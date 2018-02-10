import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

/*
 * activity log to track user interactions
 */

const options = {
  strict: false
};

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
  schema.plugin(timestamps);
  return mongoose.model(name, schema);
}

model.schema = fields;