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
 */

const fields = {
  aggregation: { type: String,           // aggregation format
    default: '${verb}-${time}'           // default based on the verb and day
  },
  rank: { type: Object,                  // custom ranking
    default: { updatedAt: -1 }           // default by updatedAt desc
  }
};

module.exports = function model (app, name) {
  const mongoose = app.get('mongoose');
  const FeedModel = mongoose.model('feed');
  const schema = new mongoose.Schema(fields);
  return FeedModel.discriminator(name, schema);
};
module.exports.schema = fields;