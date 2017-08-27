Supporting classes for using aqueduct-sync with Meteor mongo database.

 * buildQueue(db, collectionName): build the MongoDB queue, with specified name (async)
 * getSyncState(db, collectionName): get sync storage object (async)
 * getLocalConnection(db, pipes): local connection, with collections as per pipes (async)

The local connection will have collection instances created according to the pipe configuration, which should include either a fields array or a localKey value.  

`localKey` can be either a string or an array of strings, and if it is not specified it will default to the first fields in the `fields` array.  A unique index will automatically be created on that field  (or fields) if one does not already exist.

Methods of local collection instances:

 * get: find a single record, extracting keys from the given selector
 * find: find a set of record using an arbitrary query
 * update: update one or more record using an arbitrary query or an object id
 * upsert: upsert a single record
 * addOrUpdateChildInCollection
 * removeChildFromCollection
