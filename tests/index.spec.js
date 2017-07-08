const index = require('../lib/index')

describe('index', () => {
  it('exports buildQueue function', () => {
    expect(index).to.have.property('buildQueue').that.is.a('function')
  })

  it('exports getLocalConnection function', () => {
    expect(index).to.have.property('getLocalConnection').that.is.a('function')
  })
})
