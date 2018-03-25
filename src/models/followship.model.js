import { plugins } from 'mostly-feathers-mongoose';

const options = {
  timestamps: true
};

/**
 * Following relationship between feed groups
 */
const fields = {
  follower: { type: String, required: true },  // the feed group 'timeline:jessica'
  followee: { type: String, required: true },  // target feed group i.e. 'user:eric'
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ follower: 1 });
  schema.index({ followee: 1 });
  schema.index({ follower: 1, followee: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;