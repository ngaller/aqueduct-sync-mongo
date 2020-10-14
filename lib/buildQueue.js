const mongoDbQueue = require("mongodb-queue"),
  promisify = require("es6-promisify");

const OPTION_DEFAULTS = {
  // usually we won't want the messages to be available again for retrieval until a sufficient time has ellapsed
  // so as to avoid dupes when the remote is taking too long to process them
  visibility: 600,
};

module.exports = function buildQueue(
  db,
  collectionName = "SyncQueue",
  options = {}
) {
  const q = mongoDbQueue(
    db,
    collectionName,
    Object.assign(OPTION_DEFAULTS, options)
  );
  // don't have to wait for this to complete
  q.createIndexes((err) => {
    if (err) console.warn("error creating indexes on queue", err);
  });
  const ack = (msg) => promisify(q.ack, q)(msg.ack),
    get = promisify(q.get, q),
    add = promisify(q.add, q);
  return { ack: ack, get: get, add: add };
};
