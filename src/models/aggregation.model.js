import mongose from 'mongoose';
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
const addMany = (mongoose, model) => (activities, rank = { updatedAt: -1 }, limit = 15) => {
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
        fp.assoc('_id', new mongoose.Types.ObjectId()),
        fp.assoc('createdAt', new Date()),
        fp.assoc('updatedAt', new Date()),
        fp.dissoc('group')
      ), items);
      // bulk upsert
      bulk.find({
        feed, group, verb,
        type: 'aggregation',
        [`activities.${limit-1}`]: { $exists: false } // max size to insert
      }).upsert().updateOne({
        $setOnInsert: { createdAt: new Date() },
        $currentDate: { updatedAt: true },
        $push: {
          activities: {
            $each: items,
            $sort: rank
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

// update many
const updateMany = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);

  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = Aggregation.collection.initializeUnorderedBulkOp();
    activities.forEach(activity => {
      // add timestamp fields
      const { _id, id, foreignId } = activity;
      if (_id || id) {
        bulk.find({
          'activities._id': _id || id
        }).updateOne({
          $set: {
            activities: activity
          }
        });
      } else {
        bulk.find({
          'activities.foreignId': foreignId
        }).updateOne({
          $set: {
            activities: activity
          }
        });
      }
    });
    bulk.execute((err, result) => {
      if (err) return reject(err);
      // remove aggregation activity with empty activities
      Aggregation.collection.remove({
        type: 'aggregation',
        activities: { $size: 0 }
      });
      return resolve(result.toJSON());
    });
  });
};

// remove many
const removeMany = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);

  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = Aggregation.collection.initializeUnorderedBulkOp();
    activities.forEach(activity => {
      // add timestamp fields
      const { id, foreignId } = activity;
      if (id) {
        bulk.find({
          'activities._id': id
        }).updateOne({
          $pull: {
            activities: { _id: id }
          }
        });
      } else {
        bulk.find({
          'activities.foreignId': foreignId
        }).updateOne({
          $pull: {
            activities: { foreignId }
          }
        });
      }
    });
    bulk.execute((err, result) => {
      if (err) return reject(err);
      // remove aggregation activity with empty activities
      Aggregation.collection.remove({
        type: 'aggregation',
        activities: { $size: 0 }
      });
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
  schema.statics.removeMany = removeMany(mongoose, name);

  return ActivityModel.discriminator(name, schema);
}

model.schema = fields;