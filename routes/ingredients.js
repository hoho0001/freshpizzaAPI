const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')
const mongoose = require('mongoose');

const auth = require('../middleware/auth')
const isStaff = require('../middleware/isStaff')
const Ingredient = require('../models/Ingredient')
const express = require('express')
const router = express.Router()

// List All Ingredients
router.get('/', async (req, res) => {
  const instock = (req.query.instock == "true")? {quantity: {$gt: 10}} : ((req.query.instock == "false")? {quantity: {$lte: 0}} : {})
  const ingredients = await Ingredient.find(instock)
  
  res.send({data: ingredients})
})

// STAFF: create an Ingredient 
router.post('/', [auth, isStaff, sanitizeBody], async (req, res,next) => {
  new Ingredient(req.sanitizedBody)
    .save()
    .then(newIngredient => res.status(201).send({data: newIngredient}))
    .catch (next)
})

// Get details for an ingredient
router.get('/:id', async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const ingredient = await Ingredient.findById(req.params.id)
    
    if (!ingredient) throw new ResourceNotFoundError(
      `We could not find an ingredient with id: ${req.params.id}`
    )
    res.send({data: ingredient})
  } catch (err) {
    next(err)
  }
})

const update = (overwrite = false) => async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.sanitizedBody,
      {
        new: true,
        overwrite,
        runValidators: true
      }
    )
    if (!ingredient) throw new ResourceNotFoundError(
      `We could not find a ingredient with id: ${req.params.id}`
    )
    res.send({data: ingredient})
  } catch (err) {
    next(err)
  }
}
// STAFF: edit Ingredient
router.put('/:id', [auth, isStaff, sanitizeBody], update((overwrite = true)))
router.patch('/:id', [auth, isStaff, sanitizeBody],  update((overwrite = false)))

// STAFF: delete Ingredient
router.delete('/:id', [auth, isStaff], async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const ingredient = await Ingredient.findByIdAndRemove(req.params.id)
    if (!ingredient) throw new ResourceNotFoundError(
      `We could not find an ingredient with id: ${req.params.id}`
    )
    res.send({data: ingredient})
  } catch (err) {
    next(err)
  }
})

// Helper functions
const validateId = async id => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await Ingredient.countDocuments({_id: id})) return true
  }
  throw new ResourceNotFoundError(`Could not find an ingredient with id ${id}`)
}


module.exports = router