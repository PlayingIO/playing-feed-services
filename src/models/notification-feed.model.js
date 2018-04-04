import aggregatedFeed from './aggregated-feed.model';

/**
 * Notification feeds are similar to aggregated feeds can be marked as seen or read.
 */
const fields = Object.assign(aggregatedFeed.schema, {
  seenAt: { type: Date },                // user opened/browsed the content
  readAt: { type: Date }                 // user engaged with the content
});

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
}

model.schema = fields;