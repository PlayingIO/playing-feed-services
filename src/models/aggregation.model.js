import fp from 'mostly-func';
import activity from './activity.model';

const options = {
  strict: false
};
const MaxAggregatedLength = 15; // max number of aggregated activities in an Aggragation

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

  const groupedActivities = fp.groupWith(a => a.feed + a.group + a.verb, activities);
  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = Aggregation.collection.initializeUnorderedBulkOp();
    groupedActivities.forEach(items => {
      // add timestamp fields
      const { feed, group, verb } = items[0];
      items = fp.map(fp.pipe(
        fp.assoc('createdAt', new Date()),
        fp.assoc('updatedAt', new Date()),
        fp.dissoc('group')
      ), items);
      // bulk upsert
      bulk.find({
        feed, group, verb,
        [`activities.${MaxAggregatedLength}`]: { $exists: false } // max size to upsert
      }).upsert().updateOne({
        $setOnInsert: { createdAt: new Date() },
        $currentDate: { updatedAt: true },
        $push: {
          activities: {
            $each: items,
            $sort: { updatedAt: -1 }
          }
        }
      });
    });
    bulk.execute((err, result) => {
      if (err) return reject(err);
      return resolve(result.toJSON());
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