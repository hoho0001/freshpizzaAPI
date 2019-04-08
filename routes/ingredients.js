const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')

// const auth = require('../middleware/auth')
// const admin = require('../middleware/isStaff')
const Ingredient = require('../models/Ingredient')
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  const ingredients = await Ingredient.find()
  res.send({data: ingredients})
})

router.post('/',sanitizeBody, async (req, res,next) => {
  new Ingredient(req.sanitizedBody)
    .save()
    .then(newIngredient => res.status(201).send({data: newIngredient}))
    .catch (next)
})

router.get('/:id', async (req, res, next) => {
  try {
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
router.put('/:id',  update((overwrite = true)))
router.patch('/:id',  update((overwrite = false)))

router.delete('/:id', async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndRemove(req.params.id)
    if (!ingredient) throw new ResourceNotFoundError(
      `We could not find an ingredient with id: ${req.params.id}`
    )
    res.send({data: ingredient})
  } catch (err) {
    next(err)
  }
})


module.exports = router