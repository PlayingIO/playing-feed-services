import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

/*
 * notification is similar to aggregated feeds can be marked as seen or read.
 */
const fields = {
  aggregation: { type: 'Mixed', required: true }
};

export default function(app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
} 