const Collection = require('./collection')

/**
 * Access to the local collections.  The collections are added via the pipe configuration.
 */
class LocalConnection {
  constructor(db) {
    this.db = db
  }

  async addCollection(pipe) {
    this[pipe.local] = new Collection(this.db, pipe.local, pipe.fields[0])
    await this[pipe.local].configure()
  }
}

module.exports = LocalConnection
