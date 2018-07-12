const fp = require('mostly-func');

const options = {
  timestamps: true,
  discriminatorKey: 'type',
  strict: false
};

/**
 * Activity tells the story of a person performing an action on or with an object.
 *
 * [Activity Streams Specification 1.0](http://activitystrea.ms/specs/json/1.0/)
 */
const fields = {
  feed: { type: String, required: true },      // feed group id
  actor: { type: String, required: true },     // actor performing the activity
  verb: { type: String, required: true },      // verb of the activity, i.e. loved, liked, followed
  object: { type: String },                    // object of the activity is related to
  target: { type: String },                    // optional target where the activity is belongs to, i.e. Surf board
  type: { type: String, default: 'activity' }, // discriminator key
  cc: { type: Array, default: undefined },     // list of feeds to be copied
  foreignId: { type: String },                 // unique id for update this activity with time
  time: { type: String, default:               // time of the activity, isoformat (UTC localtime)
    () => new Date().toISOString()
  },
  source: { type: String },                    // source feed of cc/followship
  state: { type: String },                     // state of the activity
  popularity: { type: Number, default: 1 },    // ranking of the activity
  // other free form fields as needed
};


// update activities
const updateActivities = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const Activity = mongoose.model(model);

  const operations = fp.flatMap(activity => {
    const fields = fp.renameKeys({ id: '_id' }, activity);
    if (activity._id) {
      return {
        updateOne: {
          filter: { '_id': activity._id },
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
            'foreignId': activity.foreignId,
            'time': activity.time
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
  return Activity.bulkWrite(operations, { ordered: false })
    .then(results => results.toJSON());
};

module.exports = function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ feed: 1, actor: 1, verb: 1, object: 1, type: 1 });
  schema.index({ feed: 1, verb: 1, state: 1 });
  schema.index({ feed: 1, time: 1, foreignId: 1 });

  schema.statics.updateActivities = updateActivities(mongoose, name);

  return mongoose.model(name, schema);
};
module.exports.schema = fields;