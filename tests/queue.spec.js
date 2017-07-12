const testConnection = require('./testConnection.js')
const QueueFactory = require('../lib/buildQueue')
const mongoDbQueue = require('mongodb-queue')
const mongodb = require('mongodb')
const promisify = require('es6-promisify')

// these tests require mongodb to be running locally
describe('Queue', () => {
  it('creates queue collection', async () => {
    const db = await testConnection()
    const queue = await QueueFactory(db, 'ErpSyncQueue')

    const cursor = await db.listCollections({name: 'ErpSyncQueue'})
    const collections = await cursor.toArray()
    expect(queue).to.be.ok
    expect(collections).to.have.length(1)
  })

  it('does not error when called more than once', async () => {
    const db = await testConnection()
    await QueueFactory(db, 'ErpSyncQueue')
    await QueueFactory(db, 'ErpSyncQueue')

    const cursor = await db.listCollections({name: 'ErpSyncQueue'})
    const collections = await cursor.toArray()
    expect(collections).to.have.length(1)
  })

  it('retrieves sent message', async () => {
    const db = await testConnection()
    const queue = await QueueFactory(db, 'ErpSyncQueue')
    const realQueue = mongoDbQueue(db, 'ErpSyncQueue')
    await promisify(realQueue.add, realQueue)({payload: 'hello'})
    const msg = await queue.get()
    expect(msg.payload).to.eql({payload: 'hello'})
  })

  it('saves message that has an objectid', async () => {
    const db = await testConnection()
    const queue = await QueueFactory(db, 'ErpSyncQueue')
    const realQueue = mongoDbQueue(db, 'ErpSyncQueue')
    const id = mongodb.ObjectId()
    await promisify(realQueue.add, realQueue)({identifier: id})
    const msg = await queue.get()
    const identifier = msg.payload.identifier
    expect(identifier.toString()).to.equal(id.toString())
    expect(identifier.equals(id)).to.equal(true)
  })

  it('returns null when no message to ack', async () => {
    const db = await testConnection()
    const queue = await QueueFactory(db)
    const msg = await queue.get()
    expect(msg).to.equal(undefined)
  })

  it('does not retrieve same message twice', async () => {
    const db = await testConnection()
    const queue = await QueueFactory(db, 'ErpSyncQueue')
    const realQueue = mongoDbQueue(db, 'ErpSyncQueue')
    await promisify(realQueue.add, realQueue)({payload: 'hello'})
    await queue.get()
    const msg = await queue.get()
    expect(msg).to.equal(undefined)
  })
})
