const isPlainObject = require('is-plain-object')

/**
 * Wrapper for access to a collection
 */
class Collection {
  constructor(db, collectionName, keyFields, indexes = keyFields) {
    this.coll = db.collection(collectionName)
    this.keyFields = Array.isArray(keyFields) ? keyFields : [keyFields]
    this.indexes = Array.isArray(indexes) ? indexes : [indexes]
  }

  configure() {
    return Promise.all(this.indexes.map(indexSpec => this.coll.ensureIndex(indexSpec)))
  }

  upsert(record) {
    // we have to do this in 2 steps, because findOneAndUpdate can't differentiate
    // between upsert and update, and updateOne can't return the updated record's _id
    return this.coll.findOneAndUpdate(this._getQuery(record), {$set: record}, {
      projection: {_id: 1},
      upsert: false
    })
      .then(updateResult => {
        if(updateResult.value) {
          return { updated: 1, inserted: 0, recordId: updateResult.value._id }
        } else {
          return this.coll.insertOne(record).then(({insertedId}) => ({
            inserted: 1, updated: 0, recordId: insertedId
          }))
        }
      })
  }

  update(record, identifier) {
    if(!identifier) {
      identifier = this._getQuery(record)
    } else if(!isPlainObject(identifier)) {
      identifier = {_id: identifier}
    }
    return this.coll.updateMany(identifier, {$set: record})
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
    if(!isPlainObject(selector))
      // ObjectID
      return {_id: selector}
    return this.keyFields.reduce((o, k) =>
      Object.assign(o, {[k]: selector[k]}), {})
  }
}

module.exports = Collection
