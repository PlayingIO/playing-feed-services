/**
 * Notification feeds are similar to aggregated feeds can be marked as seen or read.
 */
const fields = {
  aggregation: { type: String,           // aggregation format
    default: '${verb}-${object}-${time}' // default based on the verb, object and day
  },
  rank: { type: Object,                  // custom ranking
    default: { updatedAt: -1 }           // default by updatedAt desc
  },
  seenAt: { type: Date },                // user opened/browsed the content
  readAt: { type: Date }                 // user engaged with the content
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
}

model.schema = fields;