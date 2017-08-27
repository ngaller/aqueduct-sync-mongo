const Collection = require('./collection')

/**
 * Access to the local collections.  The collections are added via the pipe configuration.
 */
class LocalConnection {
  constructor(db) {
    this.db = db
  }

  // add a collection, creating necessary indexes
  // returns a promise that will resolve once the indexes are created (the collection can be used
  // immediately, though)
  addCollection(pipe, keyField = '') {
    this[pipe.local] = new Collection(this.db, pipe.local, keyField || pipe.localKey || pipe.fields[0])
    return this[pipe.local].configure(this.db)
  }
}

module.exports = LocalConnection
