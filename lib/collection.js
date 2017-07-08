const {isArray} = require('lodash')

/**
 * Wrapper for access to a collection
 */
class Collection {
  constructor(db, collectionName, keyFields, indexes = keyFields) {
    this.coll = db.collection(collectionName)
    this.keyFields = isArray(keyFields) ? keyFields : [keyFields]
    this.indexes = isArray(indexes) ? indexes : [indexes]
  }

  async configure() {
    await Promise.all(this.indexes.map(indexSpec => this.coll.ensureIndex(indexSpec)))
    return this
  }

  upsert(record) {
    return this.coll.updateMany(this._getQuery(record), {$set: record}, {upsert: true}).then(r => ({
      updated: r.matchedCount,
      inserted: r.upsertedCount
    }))
  }

  update(record, identifier) {
    if(!identifier) {
      identifier = this._getQuery(record)
    }
    return this.coll.update(identifier, {$set: record}, {multi: true})
  }

  get(selector) {
    return this.coll.findOne(this._getQuery(selector))
  }

  async addOrUpdateChildInCollection(parentId, relatedListName, child, childIdField) {
    if (!parentId)
      return

    const result = await this.coll.updateOne({
      [this.keyFields[0]]: parentId,
      [relatedListName]: {$elemMatch: {[childIdField]: child[childIdField]}}
    }, { $set: {[`${relatedListName}.$`]: child}
    })
    if(result.matchedCount === 0) {
      await this.coll.updateOne({
        [this.keyFields[0]]: parentId,
        [relatedListName]: {$not: {$elemMatch: {Id: child[childIdField]}}}
      }, {$push: {[relatedListName]: child}})
    }
  }

  getKeyField() {
    return this.keyFields[0]
  }

  _getQuery(selector) {
    if(selector._id)
      return {_id: selector._id}
    return this.keyFields.reduce((o, k) =>
      Object.assign(o, {[k]: selector[k]}), {})
  }
}

module.exports = Collection
