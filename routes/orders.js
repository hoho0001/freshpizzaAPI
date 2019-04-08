const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')

// const auth = require('../middleware/auth')
// const admin = require('../middleware/isStaff')
const Order = require('../models/Order')
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  const orders = await Order.find().populate('pizzas')
  res.send({data: orders})
})

router.post('/',sanitizeBody, async (req, res, next) => {
  const customer = await Customer.findById(req.body.customer);
  if (!customer) return res.status(400).send('Invalid customer.');

  new Order(req.sanitizedBody)
    .save()
    .then(newOrder => {
      console.log("newOrder")
      console.log(newOrder)
      res.status(201).send({data: newOrder})})
    .catch (next)
})

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('pizzas')
    
    if (!order) throw new ResourceNotFoundError(
      `We could not find a order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})

const update = (overwrite = false) => async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.sanitizedBody,
      {
        new: true,
        overwrite,
        runValidators: true
      }
    )
    if (!order) throw new ResourceNotFoundError(
      `We could not find a order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
}
router.put('/:id',  update((overwrite = true)))
router.patch('/:id',  update((overwrite = false)))

router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndRemove(req.params.id)
    if (!order) throw new ResourceNotFoundError(
      `We could not find a order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})
router.delete('/', async (req, res) => {
  try {
    const order = await Order.deleteMany()
    if (!order) throw new ResourceNotFoundError(
      `We could not find a order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})

module.exports = router