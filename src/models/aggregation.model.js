const fp = require('mostly-func');
const activity = require('./activity.model');

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
const addActivities = (mongoose, model) => (activities, rank = { updatedAt: -1 }, limit = 15) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);

  const groupedActivities = fp.groupWith(a => a.feed + a.group + a.verb, activities);
  const operations = fp.map(items => {
    // add timestamp fields
    const { feed, group, verb } = items[0];
    items = fp.map(fp.pipe(
      fp.assocWith(() => new mongoose.Types.ObjectId(), '_id'),
      fp.assoc('createdAt', new Date()),
      fp.assoc('updatedAt', new Date()),
      fp.dissoc('group')
    ), items);
    return {
      updateOne: {
        filter: {
          feed, group, verb,
          type: 'aggregation',
          [`activities.${limit-1}`]: { $exists: false } // max size to insert
        },
        update: {
          $setOnInsert: { createdAt: new Date(), updatedAt: new Date() },
          $push: {
            activities: { $each: items, $sort: rank }
          }
        },
        upsert: true
      }
    };
  }, groupedActivities);
  // bulk with unordered to increase performance
  return Aggregation.bulkWrite(operations, { ordered: false }).then(results => {
    return results.toJSON();
  });
};

// update activities
const updateActivities = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);

  const operations = fp.flatMap(activity => {
    activity = fp.renameKeys({ id: '_id' }, activity);
    activity.updatedAt = new Date(); // root updatedAt
    const fields = fp.mapKeys(fp.concat('activities.$.'), activity);
    if (activity._id) {
      return {
        updateOne: {
          filter: { 'activities._id': activity._id },
          update: {
            $currentDate: { updatedAt: true },
            $set: fields
          }
        }
      };
    } else if (activity.foreignId && activity.time) {
      return {
        updateOne: {
          filter: {
            'activities.foreignId': activity.foreignId,
            'activities.time': activity.time
          },
          update: {
            $currentDate: { updatedAt: true },
            $set: fields
          }
        }
      };
    } else {
      return [];
    }
  }, activities);
  // bulk with unordered to increase performance
  return Aggregation.bulkWrite(operations, { ordered: false }).then(results => {
    // remove aggregation activity with empty activities
    Aggregation.remove({
      type: 'aggregation',
      activities: { $size: 0 }
    }).exec();
    return results.toJSON();
  });
};

// remove many
const removeActivities = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Aggregation = mongoose.model(model);

  const operations = fp.flatMap(activity => {
    // add timestamp fields
    const { _id, id } = activity;
    if (_id || id) {
      return {
        updateOne: {
          filter: { 'activities._id': _id || id },
          update: {
            $currentDate: { updatedAt: true },
            $pull: { activities: { _id: _id || id } }
          }
        }
      };
    } else if (activity.foreignId && activity.time) {
      return {
        updateOne: {
          filter: {
            'activities.foreignId': activity.foreignId,
            'activities.time': activity.time
          },
          update: {
            $currentDate: { updatedAt: true },
            $pull: {
              activities: {
                foreignId: activity.foreignId,
                time: activity.time
              }
            }
          }
        }
      };
    } else {
      return [];
    }
  }, activities);
  // bulk with unordered to increase performance
  return Aggregation.bulkWrite(operations, { ordered: false }).then(results => {
    // remove aggregation activity with empty activities
    Aggregation.remove({
      type: 'aggregation',
      activities: { $size: 0 }
    }).exec();
    return results.toJSON();
  });
};

module.exports = function model (app, name) {
  const mongoose = app.get('mongoose');
  const ActivityModel = mongoose.model('activity');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ feed: 1, group: 1, verb: 1 });
  schema.index({ 'activities._id': 1 });
  schema.index({ 'activities.feed': 1, 'activities.group': 1, 'activities.verb': 1 });

  schema.statics.addActivities = addActivities(mongoose, name);
  schema.statics.updateActivities = updateActivities(mongoose, name);
  schema.statics.removeActivities = removeActivities(mongoose, name);

  return ActivityModel.discriminator(name, schema);
};
module.exports.schema = fields;