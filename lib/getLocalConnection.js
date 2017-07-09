const LocalConnection = require('./localConnection.js')

module.exports = function getLocalConnection(db, pipes) {
  const connection = new LocalConnection(db)
  return Promise.all(pipes.map(p =>
    connection.addCollection(p).catch(err => console.warn('error configuring collection ' + p.local, err))
  )).then(() => connection)
}
