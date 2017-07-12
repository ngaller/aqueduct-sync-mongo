const {isArray} = require('lodash')
const isPlainObject = require('is-plain-object')

/**
 * Wrapper for access to a collection
 */
class Collection {
  constructor(db, collectionName, keyFields, indexes = keyFields) {
    this.coll = db.collection(collectionName)
    this.keyFields = isArray(keyFields) ? keyFields : [keyFields]
    this.indexes = isArray(indexes) ? indexes : [indexes]
  }

  configure() {
    return Promise.all(this.indexes.map(indexSpec => this.coll.ensureIndex(indexSpec)))
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
    } else if(!isPlainObject(identifier)) {
      identifier = {_id: identifier}
    }
    return this.coll.update(identifier, {$set: record}, {multi: true})
  }

  get(selector) {
    return this.coll.findOne(this._getQuery(selector))
  }

  find(selector) {
    return this.coll.find(selector).toArray()
  }

  addOrUpdateChildInCollection(parentId, relatedListName, child, childIdField) {
    return this.coll.updateOne({
      [this.keyFields[0]]: parentId,
      [relatedListName]: {$elemMatch: {[childIdField]: child[childIdField]}}
    }, { $set: {[`${relatedListName}.$`]: child}
    }).then(result => {
      if(result.matchedCount === 0) {
        return this.coll.updateOne({
          [this.keyFields[0]]: parentId,
          [relatedListName]: {$not: {$elemMatch: {Id: child[childIdField]}}}
        }, {$push: {[relatedListName]: child}})
      }
    })
  }

  removeChildFromCollection(parentId, relatedListName, child, childIdField) {
    throw new Error('Not implemented')
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
