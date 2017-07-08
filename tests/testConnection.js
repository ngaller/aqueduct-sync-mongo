const {MongoClient} = require('mongodb')

let connection = null

// connect to local test database, drop it and return connection
// it only drops the database during the initial connection, subsequent calls to testConnection
// are cached
// the connection address is hard coded
module.exports = function() {
  if(connection)
    return Promise.resolve(connection)

  return MongoClient.connect('mongodb://localhost:27017/test').then(db => {
    connection = db
    return db.dropDatabase().then(() => connection)
  })
}
