import fp from 'mostly-func';
import activity from './activity.model';

const options = {
  strict: false
};

/**
 * Aggregated activity
 */
const fields = {
  actors: [{ type: String, required: true }],  // distinct actors (cache)
  objects: [{ type: String, required: true }], // distinct objects (cache)
  activities: [activity.schema],               // aggregated activities
  group: { type: String, required: true },     // group by aggregation format result
  seenAt: { type: Date },                      // user opened/browsed the activity
  readAt: { type: Date }                       // user engaged with the activity
};

// add many
const addMany = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);
  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = Aggregation.collection.initializeUnorderedBulkOp();
    activities.forEach(activity => {
      bulk.find({
        feed: activity.feed,
        group: activity.group,
        verb: activity.verb
      }).upsert().updateOne({
        $push: {
          activities: fp.dissoc('group', activity)
        }
      });
    });
    bulk.execute((err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const ActivityModel = mongoose.model('activity');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ feed: 1, group: 1, verb: 1 });

  schema.statics.addMany = addMany(mongoose, name);

  return ActivityModel.discriminator(name, schema);
}

model.schema = fields;