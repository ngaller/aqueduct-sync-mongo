const testConnection = require('./testConnection.js'),
  getSyncState = require('../lib/getSyncState')

describe('syncState', () => {
  it('saves sync state', () => testConnection()
    .then(db =>getSyncState(db, 'SyncState'))
    .then(ss =>
      ss.saveSyncState('testing', '123').then(() => ss.getSyncState('testing').then((val) => {
        expect(val).to.equal('123')
      }))))

  it('returns null if no state', () => testConnection()
    .then(db => getSyncState(db, 'SyncState'))
    .then(ss => ss.getSyncState('something').then((val) => expect(val).to.equal(null))))
})
