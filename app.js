'use strict'

require('./startup/database')()
const compression = require('compression')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const app = express()

const sanitizeMongo = require('express-mongo-sanitize')

app.use(cors())  //apply CORS as the first middleware 

// attemtp to compress all routes
app.use(compression())
app.use(helmet())
app.use(express.json())
app.use(sanitizeMongo()) // Database Injection


app.use('/api/orders', require('./routes/orders'))
app.use('/api/pizzas', require('./routes/pizzas'))
app.use('/api/ingredients', require('./routes/ingredients'))
app.use('/auth', require('./routes/auth'))

app.use(require('./middleware/logErrors'))
app.use(require('./middleware/handleErrors'))

const port = process.env.port || 3030
app.listen(port, () => console.log(`Server listening on port ${port} ...`))