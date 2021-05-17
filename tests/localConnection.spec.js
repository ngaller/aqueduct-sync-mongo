const testConnection = require('./testConnection.js'),
  LocalConnection = require('../lib/localConnection.js')

const omit = (obj, ...keys) => {
  const clone = Object.assign({}, obj)
  keys.forEach(k => delete clone[k])
  return clone
}

const customerConfig = {
  local: 'Customers',
  fields: ['CustNum']
}
const fieldLessConfig = {
  local: 'FieldLess',
  localKey: ['key1', 'key2']
}
// localConnection is responsible for abstracting the mongo database
describe('localConnection', () => {
  let db, lc

  beforeEach(async () => {
    db = await testConnection()
    lc = new LocalConnection(db)
    lc.addCollection(customerConfig)
    lc.addCollection(fieldLessConfig)
  })

  it('has a customers collection', async () => {
    expect(lc.Customers).to.be.ok
    lc.Customers.should.have.property('upsert').that.is.a('function')
  })

  it('has a fieldless collection', async () => {
    expect(lc.FieldLess).to.be.ok
    lc.FieldLess.should.have.property('upsert').that.is.a('function')
  })

  describe('upsert', () => {
    it('inserts a new record', async () => {
      return lc.Customers.upsert({CustNum: '6'}, 'CustNum').then(upsertResult => {
        expect(upsertResult.updated).to.equal(0)
        expect(upsertResult.inserted).to.equal(1)
        return db.collection('Customers').findOne({CustNum: '6'}).then((result) => {
          expect(result.CustNum).to.equal('6')
          expect(String(result._id)).to.equal(String(upsertResult.record._id))
        })
      })
    })

    it('returns the record id which is a plain string', async () => {
      return lc.Customers.upsert({CustNum: '6'}, 'CustNum').then(upsertResult => {
        expect(upsertResult.record._id).to.be.a('string')
        return db.collection('Customers').findOne({_id: upsertResult.record._id}).then((result) => {
          expect(result.CustNum).to.equal('6')
        })
      })
    })

    it('updates existing record', async () => {
      return db.collection('Customers').insertOne({CustNum: '10', Name: 'Poudroux', Amount: 24}).then(() =>
        lc.Customers.upsert({CustNum: '10', Name: 'Testing', OtherField: 123}).then(upsertResult => {
          expect(upsertResult.updated).to.equal(1)
          expect(upsertResult.inserted).to.equal(0)
          return db.collection('Customers').findOne({CustNum: '10'}).then((result) => {
            expect(omit(result, '_id')).to.eql({
              CustNum: '10', Name: 'Testing', Amount: 24, OtherField: 123
            })
            expect(String(result._id)).to.equal(String(upsertResult.record._id))
          })
        }))
    })

    it('uses $setOnInsert if specified', async () => {
      return lc.Customers.upsert({CustNum: 'NEWCUST', $setOnInsert: { Foo: 'bar' }}, 'CustNum').then(upsertResult => {
        return db.collection('Customers').findOne({CustNum: 'NEWCUST'}).then((result) => {
          expect(result.Foo).to.equal('bar')
        })
      })
    })
  })

  describe('update', () => {
    it('updates using identifier', async () => {
      const r = await db.collection('Customers').insertOne({CustNum: 'WITH-ID', Name: 'Poudroux', Amount: 24})
      const id = r.insertedId
      await lc.Customers.update({Name: 'Joe'}, id)
      const modified = await db.collection('Customers').findOne({_id: id})
      expect(modified).to.be.ok
      expect(modified.Name).to.equal('Joe')
    })

    it('updates multiple records', async () => {
      await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent'})
      await lc.Customers.upsert({CustNum: '11', ParentId: 'the-parent'})
      await lc.Customers.update({ParentName: 'The name'}, {ParentId: 'the-parent'})
      for(let CustNum of ['10', '11']) {
        let customer = await db.collection('Customers').findOne({CustNum})
        expect(customer, CustNum).to.have.property('ParentName').that.eql('The name')
      }
    })

    it('updates using operation', async() => {
      const r = await db.collection('Customers').insertOne({CustNum: '12', Name: 'Poudroux', Transactions: [{amount: 222}]})
      const id = r.insertedId
      await lc.Customers.update({ $push: {Transactions: {amount: 333}}, $set: {Name: 'Joe'} }, id)
      const modified = await db.collection('Customers').findOne({_id: id})
      expect(modified.Name).to.equal('Joe')
      expect(modified.Transactions).to.eql([{amount: 222}, {amount: 333}])
    })
  })

  describe('addOrUpdateChildInCollection', () => {
    it('adds child to collection', async () => {
      await db.collection('Customers').removeMany({})
      await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent', Children: [{ChildId: '1'}]})
      await lc.Customers.addOrUpdateChildInCollection({CustNum: '10'}, 'Children', {ChildId: '2', Content: 'Test'}, 'ChildId')
      const customer = await lc.Customers.get({CustNum: '10'})
      expect(customer.Children).to.eql([{ChildId: '1'}, {ChildId: '2', Content: 'Test'}])
    })

    it('adds child to collection when it does not exist', async () => {
      await db.collection('Customers').removeMany({})
      await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent'})
      await lc.Customers.addOrUpdateChildInCollection({CustNum: '10'}, 'Children', {ChildId: '2', Content: 'Test'}, 'ChildId')
      const customer = await lc.Customers.get({CustNum: '10'})
      expect(customer.Children).to.eql([{ChildId: '2', Content: 'Test'}])
    })

    it('replaces existing child in collection', async () => {
      await db.collection('Customers').removeMany({})
      await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent', Children: [{ChildId: '1'}]})
      await lc.Customers.addOrUpdateChildInCollection({CustNum: '10'}, 'Children', {ChildId: '1', Content: 'Test'}, 'ChildId')
      const customer = await lc.Customers.get({CustNum: '10'})
      expect(customer.Children).to.eql([{ChildId: '1', Content: 'Test'}])
    })
  })

  describe('removeChildFromCollection', () => {
    it.skip('removes child from collection', async () => {
    })
  })

  describe('get', () => {
    let customerId

    beforeEach(async () => {
      const customer = await lc.Customers.upsert({CustNum: '10', ParentId: 'the-parent', Children: [{ChildId: '1'}]})
      customerId = customer.record._id
    })

    it('gets a record using a selector', async () => {
      const cust = await lc.Customers.get({CustNum: '10'})
      expect(cust).to.be.ok.and.to.have.property('ParentId').that.equals('the-parent')
    })

    it('gets a record using a Mongo ID', async () => {
      const cust = await lc.Customers.get(customerId)
      expect(cust).to.be.ok.and.to.have.property('ParentId').that.equals('the-parent')
    })
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
