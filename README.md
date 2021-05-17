Supporting classes for using aqueduct-sync with Meteor mongo database.

 * buildQueue(db, collectionName, options): build the MongoDB queue, with specified name (async)
  - the specified options are passed as is to Mongo-Queue - see [https://github.com/chilts/mongodb-queue]
  - visibility will default to 10 minutes if not specified, to avoid processing an update twice if the remote is taking too long
 * getSyncState(db, collectionName): get sync storage object (async)
 * getLocalConnection(db, pipes): local connection, with collections as per pipes (async)

The local connection will have collection instances created according to the pipe configuration, which should include either a fields array or a localKey value.

`localKey` can be either a string or an array of strings, and if it is not specified it will default to the first fields in the `fields` array.  A unique index will automatically be created on that field  (or fields) if one does not already exist.

Methods of local collection instances:

 * get: find a single record, extracting keys from the given selector
 * find: find a set of record using an arbitrary query
 * update: update one or more record using an arbitrary query or an object id
      It's possible to pass a MongoDB operation instead of a record.  Because it's a bit of a hack,
      the library will only recognize the operations that contain one of these operators:
      $push, $set, $unset.
 * upsert: upsert a single record
      If the record contains some keys that start with a $ sign, they will be interpreted as MongoDB
      operations.
 * remove: remove records matching a selector
 * addOrUpdateChildInCollection
 * removeChildFromCollection

Methods of the queue:

 * get
 * add(payload, options) - options are the same as for Mongo-Queue
 * ack

Methods all return a promise.
