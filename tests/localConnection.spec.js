const testConnection = require('./testConnection.js'),
  LocalConnection = require('../lib/localConnection.js'),
  {omit} = require('lodash')

const customerConfig = {
  local: 'Customers',
  fields: ['CustNum']
}
// localConnection is responsible for abstracting the mongo database
describe('localConnection', () => {
  it('has a customers collection', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    expect(lc.Customers).to.be.ok
    lc.Customers.should.have.property('upsert').that.is.a('function')
  })

  it('inserts a new record', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    return lc.Customers.upsert({CustNum: '6'}, 'CustNum').then(upsertResult => {
      expect(upsertResult.updated).to.equal(0)
      expect(upsertResult.inserted).to.equal(1)
      return db.collection('Customers').findOne({CustNum: '6'}).then((result) => {
        expect(result.CustNum).to.equal('6')
      })
    })
  })

  it('updates existing record', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    return db.collection('Customers').insert({CustNum: '10', Name: 'Poudroux', Amount: 24}).then(() =>
      lc.Customers.upsert({CustNum: '10', Name: 'Testing', OtherField: 123}).then(upsertResult => {
        expect(upsertResult.updated).to.equal(1)
        expect(upsertResult.inserted).to.equal(0)
        return db.collection('Customers').findOne({CustNum: '10'}).then((result) => {
          expect(omit(result, '_id')).to.eql({
            CustNum: '10', Name: 'Testing', Amount: 24, OtherField: 123
          })
        })
      }))
  })

  it('updates multiple records', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent'})
    await lc.Customers.upsert({CustNum: '11', ParentId: 'the-parent'})
    await lc.Customers.update({ParentName: 'The name'}, {ParentId: 'the-parent'})
    for(let CustNum of ['10', '11']) {
      let customer = await db.collection('Customers').findOne({CustNum})
      expect(customer, CustNum).to.have.property('ParentName').that.eql('The name')
    }
  })

  it('adds child to collection', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    await db.collection('Customers').remove({})
    await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent', Children: [{ChildId: '1'}]})
    await lc.Customers.addOrUpdateChildInCollection('10', 'Children', {ChildId: '2', Content: 'Test'}, 'ChildId')
    const customer = await lc.Customers.get({CustNum: '10'})
    expect(customer.Children).to.eql([{ChildId: '1'}, {ChildId: '2', Content: 'Test'}])
  })

  it('adds child to collection when it does not exist', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    await db.collection('Customers').remove({})
    await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent'})
    await lc.Customers.addOrUpdateChildInCollection('10', 'Children', {ChildId: '2', Content: 'Test'}, 'ChildId')
    const customer = await lc.Customers.get({CustNum: '10'})
    expect(customer.Children).to.eql([{ChildId: '2', Content: 'Test'}])
  })

  it('replaces existing child in collection', async () => {
    const db = await testConnection()
    const lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    await db.collection('Customers').remove({})
    await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent', Children: [{ChildId: '1'}]})
    await lc.Customers.addOrUpdateChildInCollection('10', 'Children', {ChildId: '1', Content: 'Test'}, 'ChildId')
    const customer = await lc.Customers.get({CustNum: '10'})
    expect(customer.Children).to.eql([{ChildId: '1', Content: 'Test'}])
  })

  it.skip('removes child from collection', async () => {
  })

  // it('updates record using composite key', async () => {
  //   const db = await testConnection()
  //   const lc = await LocalConnection(db)
  //   return db.collection('Customers').insertMany([{CustNum: '11', ParentId: '1'},
  //     {CustNum: '11', ParentId: '2'}]).then(() =>
  //       lc.Customers.upsert({CustNum: '11', ParentId: '2', Test: '123'}, ['CustNum', 'ParentId']).then(() =>
  //         db.collection('Customers').findOne({CustNum: '11', ParentId: '2'}).then(r esult => {
  //           expect(result.Test).to.equal('123')
  //         })))
  // })
})
