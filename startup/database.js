const config = require('config')
const logger = require('./logger')

module.exports = () => {
  const mongoose = require('mongoose')
  const dbConfig = config.get('db')

  // const credentials =
  //   process.env.NODE_ENV === 'production'
  //   ? `${dbConfig.username}:${dbConfig.password}@`
  //   : ''

  mongoose
    .connect(`mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}`, {
      useNewUrlParser: true
    })
    .then(() => {
      logger.log('info', `Connected to MongoDB ...`)
    })
    .catch(err => {
      logger.log('error', `Error connecting to MongoDB ...`, err)
      process.exit(1)
    })
}
