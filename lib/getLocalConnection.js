const LocalConnection = require('./localConnection.js')

module.exports = function getLocalConnection(db, pipes) {
  const connection = new LocalConnection(db)
  pipes.forEach(p => {
    connection.addCollection(p).catch(err => console.warn('error configuring collection ' + p.local, err))
  })
  return connection
}
