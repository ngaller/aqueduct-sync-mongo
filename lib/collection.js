const isPlainObject = require('is-plain-object')
const ObjectID = require('bson-objectid')

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
    // generating the id allows us to use a plain string id, which is a lot easier to deal with on the Meteor side
    // it also lets us know the inserted record's id, something that findOneAndUpdate cannot return on its own
    const id = ObjectID.generate()
    // note that findOneAndUpdate will not prevent inserting a duplicate document.  For that, a unique index must be used.
    return this.coll.findOneAndUpdate(this._getQuery(record), {$set: record, $setOnInsert: {_id: id}}, {
      projection: {_id: 1},
      upsert: true
    })
      .then(updateResult => {
        if(updateResult.value) {
          return { updated: 1, inserted: 0, recordId: updateResult.value._id }
        } else {
          return { updated: 0, inserted: 1, recordId: id }
        }
      })
  }

  update(record, identifier) {
    // note that the identifier is on the last parameter, to make it possible to pass a record
    // without the identifier, but this is opposite to the way the parameters are ordered in
    // the MongoDB API
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

  addOrUpdateChildInCollection(parentSelector, relatedListName, child, childIdField) {
    return this.coll.updateOne({
      ...this._getQuery(parentSelector),
      [relatedListName]: {$elemMatch: {[childIdField]: child[childIdField]}}
    }, { $set: {[`${relatedListName}.$`]: child}
    }).then(result => {
      if(result.matchedCount === 0) {
        return this.coll.updateOne({
          ...this._getQuery(parentSelector),
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

  getLocalKeyField() {
    return '_id'
  }

  _getQuery(selector) {
    if(selector._id)
      return {_id: selector._id}
    if(!isPlainObject(selector)) {
      // ObjectID
      return {_id: selector}
    }
    return this.keyFields.reduce((o, k) =>
      Object.assign(o, {[k]: selector[k]}), {})
  }
}

module.exports = Collection
