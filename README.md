Supporting classes for using aqueduct-sync with Meteor mongo database.

 * buildQueue(db, collectionName): build the MongoDB queue, with specified name (async)
 * getSyncState(db, collectionName): get sync storage object (async)
 * getLocalConnection(db, pipes): local connection, with collections as per pipes (async)

Methods of local collection instances:

 * get: find a single record, extracting keys from the given selector
 * find: find a set of record using an arbitrary query
 * update: update one or more record using an arbitrary query or an object id
 * upsert: upsert a single record
 * addOrUpdateChildInCollection
 * removeChildFromCollection
