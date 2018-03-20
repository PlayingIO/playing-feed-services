import { plugins } from 'mostly-feathers-mongoose';

/*
 * aggregated feed to group activities.
 */

const fields = {
  aggregation: { type: 'Mixed', required: true }
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
}

model.schema = fields;