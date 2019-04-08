'use strict'

require('./startup/database')()
const express = require('express')
const app = express()

app.use(express.json())
const sanitizeMongo = require('express-mongo-sanitize')
app.use(sanitizeMongo()) // Database Injection

app.use('/api/orders', require('./routes/orders'))
app.use('/api/pizzas', require('./routes/pizzas'))
app.use('/api/ingredients', require('./routes/ingredients'))
app.use('/auth', require('./routes/auth'))

app.use(require('./middleware/logErrors'))
app.use(require('./middleware/handleErrors'))

const port = process.env.port || 3030
app.listen(port, () => console.log(`Server listening on port ${port} ...`))