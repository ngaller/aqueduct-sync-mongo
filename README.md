Supporting classes for using aqueduct-sync with Meteor mongo database.

 * buildQueue(db, collectionName): build the MongoDB queue, with specified name (async)
 * getSyncState(db, collectionName): get sync storage object
 * getLocalConnection(db, pipes): local connection, with collections as per poipes
