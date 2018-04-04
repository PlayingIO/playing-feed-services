import fp from 'mostly-func';

// add many
export const addMany = (mongoose, model) => (activities, limit = 15) => {
  if (!Array.isArray(activities)) activities = [activities];
  const ActivityModel = mongoose.model(model);

  const groupedActivities = fp.groupWith(a => a.feed + a.group + a.verb, activities);
  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = ActivityModel.collection.initializeUnorderedBulkOp();
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
        type: 'aggregation',
        [`activities.${limit-1}`]: { $exists: false } // max size to insert
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

// remove many
export const removeMany = (mongoose, model) => (activities) => {
  if (!Array.isArray(activities)) activities = [activities];
  const ActivityModel = mongoose.model(model);

  return new Promise((resolve, reject) => {
    // bulk with unordered to increase performance
    const bulk = ActivityModel.collection.initializeUnorderedBulkOp();
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
      ActivityModel.collection.remove({
        type: 'aggregation',
        activities: { $size: 0 }
      });
      return resolve(result.toJSON());
    });
  });
};