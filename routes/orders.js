const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')
const mongoose = require('mongoose');
const Pizza = require('../models/Pizza')

const auth = require('../middleware/auth')
const isStaff = require('../middleware/isStaff')
const Order = require('../models/Order')
const User = require('../models/User')

const express = require('express')
const router = express.Router()

// STAFF: get ALL orders; User: get his orders - Tested: OK
router.get('/', auth, async (req, res) => {
  let query = ((req.user.isStaff)? {} : {customer: req.user._id})

  const orders = await Order.find(query)
  
  res.send({data: orders})
})

// USER: Create an order  - Tested: OK
router.post('/', [auth, sanitizeBody], async (req, res, next) => {

    new Order(req.sanitizedBody)
    .save()
    .then(newOrder => { res.status(201).send({data: newOrder})})
    .catch (next)

})

// USER: Get detail for an order: Tested: OK
router.get('/:id', auth, async (req, res, next) => {
  try {
    await validateId(req.params.id)
    let query = ((req.user.isStaff)? {_id: req.params.id} : {_id: req.params.id, customer: req.user._id})

    const order = await Order.findOne(query)
  
    if (!order) throw new ResourceNotFoundError(
      `We could not find an order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})

// USER: Edit an order: Tested: OK

const update = (overwrite = false) => async (req, res, next) => {
  try {
    await validateId(req.params.id)
    // if isStaff: can edit any order; User: can edit only his order
    let query = ((req.user.isStaff)? {_id: req.params.id} : {_id: req.params.id, customer: req.user._id})
    
    const order = await Order.findOneAndUpdate(
      query,
      req.sanitizedBody,
      {
        new: true,
        overwrite,
        runValidators: true
      }
    )
    if (!order) throw new ResourceNotFoundError(
      `We could not find your order with id: ${req.params.id}`
    )
    
    res.send({data: order})
  } catch (err) {
    next(err)
  }
}
// USER: edit an order
router.put('/:id', [auth, sanitizeBody], update((overwrite = true)))
router.patch('/:id', [auth, sanitizeBody], update((overwrite = false)))

// USER: cancel an Order: Tested: OK
router.delete('/:id', [auth, sanitizeBody], async (req, res, next) => {
  try {
    await validateId(req.params.id)
    // if isStaff: can cancel any order; User: can cancel only his order
    let query = ((req.user.isStaff)? {_id: req.params.id} : {_id: req.params.id, customer: req.user._id})

    const order = await Order.findOneAndRemove(query)

    if (!order) throw new ResourceNotFoundError(
      `We could not find your order with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})


// Helper functions
const validateId = async id => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await Order.countDocuments({_id: id})) return true
  }
  throw new ResourceNotFoundError(`Could not find an order with id ${id}`)
}

const validateCustomer = async id => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await User.countDocuments({_id: id})) return true
  }
  throw new ResourceNotFoundError(`Could not find a Customer with id ${id}`)
}

module.exports = router