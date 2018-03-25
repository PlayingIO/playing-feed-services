import { plugins } from 'mostly-feathers-mongoose';

/**
 * Aggregated feeds are helpful to group activities, for example:
 *  - Eric followed 10 people
 *  - Julie and 14 others like your photo
 * 
 * When insert an activity to an aggregated feed, the aggregation format will be applied.
 * By default the aggregated feed will aggregate by verb and day. 
 * 
 * Available aggregation format variables:
 *  ${verb} ${time} ${object} ${target} ${id} ${actor}
 * 
 * More Examples
 */

const fields = {
  aggregation: { type: 'Mixed', required: true }, // aggregation format (templated string) to use
  activities: [{ type: 'ObjectId' }],             // most recent activities
  seenAt: { type: Date },                         // user opened/browsed the content
  readAt: { type: Date }                          // user engaged with the content
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
}

model.schema = fields;