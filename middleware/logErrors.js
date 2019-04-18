const logger = require('../startup/logger')

module.exports = (err, req, res, next) => {
  logger.log('error', `Error: `, err)
  // console.error(err.stack)
  next(err)
}