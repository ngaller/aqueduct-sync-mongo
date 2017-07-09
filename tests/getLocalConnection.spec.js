const getLocalConnection = require('../lib/getLocalConnection.js')
const testConnection = require('./testConnection.js')

describe('getLocalConnection', () => {
  it('return connection with collections specified in pipes', async () => {
    const db = await testConnection()
    const pipes = [
      {
        local: 'Customers',
        fields: ['CustNum']
      }
    ]
    const lc = await getLocalConnection(db, pipes)
    expect(lc).to.have.property('Customers')
  })
})
