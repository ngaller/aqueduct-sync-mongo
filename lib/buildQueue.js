const mongoDbQueue = require('mongodb-queue'),
  promisify = require('es6-promisify')

module.exports = function buildQueue(db, collectionName = 'SyncQueue') {
  return db.createCollection(collectionName, {
    // mongodb queue does not work with capped collection right now
    // we could pacth it to do that if it proves to be an issue
    // capped: true, size: 10000, max: 1000
  }).then(function() {
    const q = mongoDbQueue(db, collectionName)
    // don't have to wait for this to complete
    q.createIndexes((err) => {
      if(err)
        console.warn('error creating indexes on queue', err)
    })
    const ack = msg => promisify(q.ack, q)(msg.ack),
      get = promisify(q.get, q),
      add = promisify(q.add, q)
    return {ack: ack, get: get, add: add}
  })
}
