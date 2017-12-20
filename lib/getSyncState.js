/**
 * A wrapper to persists the sync state to MongoDB.
 *
 * @return Promise
 */
module.exports = function getSyncState(db, collectionName) {
  const coll = db.collection(collectionName)
  return coll.createIndex('name', { unique: true })
    .then(() => ({
      getSyncState(name) {
        return coll.findOne({name}).then(val => val && val.state)
      },
      saveSyncState(name, state) {
        return coll.updateOne({name, state: { $lt: state }}, {$set: {state}}, {
          upsert: false
        }).then(updateResult => {
          if(updateResult.modifiedCount === 0) {
            // check that we have a sync state, there is a unique index so this will error out if it exists and is already higher
            return coll.update({name, state: {$lt: state}}, {name, state}, {upsert: true}).catch(err => {
              // console.warn('error saving sync state (this is probably OK)', err.message)
            })
          }
        })
      }
    }))
}
