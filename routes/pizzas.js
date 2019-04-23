const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')
const Ingredient = require('../models/Ingredient')
const mongoose = require('mongoose');

const auth = require('../middleware/auth')
const isStaff = require('../middleware/isStaff')
const Pizza = require('../models/Pizza')
const express = require('express')
const router = express.Router()

// List all available pizzas. Ingredients not populated; inStock = true, false. Ingredients ARE populated 
router.get('/', async (req, res) => {
  let pizzasAll
  let pizzas
  if (req.query.instock == "true"){
    pizzasAll = await Pizza.find().populate('ingredients','quantity').populate('extraToppings', 'quantity')
    pizzas = await pizzasAll.filter(checkInstock)
  } else if (req.query.instock == "false"){
    pizzasAll = await Pizza.find().populate('ingredients','quantity').populate('extraToppings', 'quantity')

    pizzas = await pizzasAll.filter(checkOutstock)

  } else pizzas = await Pizza.find()
  
  res.send({data: pizzas})
})


// STAFF: Add a Pizza: 
router.post('/', [auth, isStaff, sanitizeBody], async (req, res, next) => {
  
  //check valid Ingredients, extraToppings
  await checkIngredients(req, res)
  
  new Pizza(req.sanitizedBody)
    .save()
    .then(newPizza => {
      updateIngredients(req)
      res.status(201).send({data: newPizza})})
    .catch (next)
})

// Get details for a pizza.	Ingredients fully populated: OK
router.get('/:id', async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const pizza = await Pizza.findById(req.params.id).populate('ingredients').populate('extraToppings')
    
    if (!pizza) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
})

const update = (overwrite = false) => async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const pizza = await Pizza.findOneAndUpdate(
      {_id: req.params.id},
      req.sanitizedBody,
      {
        new: true,
        overwrite,
        runValidators: true
      }
    )
    if (!pizza) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    checkIngredients(req, res)
    updateIngredients(req)
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
}

// STAFF: edit a pizza
router.put('/:id', [auth, isStaff, sanitizeBody], update((overwrite = true)))
router.patch('/:id', [auth, isStaff, sanitizeBody], update((overwrite = false)))
// STAFF: delete a pizza : OK
router.delete('/:id', [auth, isStaff], async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const pizza = await Pizza.findByIdAndRemove(req.params.id)
    if (!pizza) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
})


const checkIngredients = async function(req,res){
  if (req.body.ingredients) {
    for (let i = 0; i < req.body.ingredients.length; i++) {
      if (mongoose.Types.ObjectId.isValid(req.body.ingredients[i])){
        const ingredients =  await Ingredient.findById(req.body.ingredients[i]);
        if (!ingredients) throw new ResourceNotFoundError(`Could not find an ingredient with id ${id}`);
        if (ingredients.quantity <= 0) return res.status(400).send('Ingredient not in stock.');
      }
      else throw new ResourceNotFoundError(`Could not find an ingredient with id ${id}`)
    }
  }

  if (req.body.extraToppings) {
    console.log('check ')
    for (let i = 0; i < req.body.extraToppings.length; i++) {
      if (mongoose.Types.ObjectId.isValid(req.body.extraToppings[i])){
        const ingredients =  await Ingredient.findById(req.body.extraToppings[i]);
        if (!ingredients) throw new ResourceNotFoundError(`Could not find an ingredient with id ${id}`);
        if (ingredients.quantity <= 0) return res.status(400).send('Ingredient not in stock.');
      }
      else throw new ResourceNotFoundError(`Could not find an ingredient with id ${id}`)
    }
  }
}

const updateIngredients = async function(req){
  if (req.body.ingredients) {
    for (let i = 0; i < req.body.ingredients.length; i++) {
      await Ingredient.updateOne(
        { _id: req.body.ingredients[i] }, 
        { $inc: { quantity: -1 }})

    }
  }
  if (req.body.extraToppings) {
    for (let i = 0; i < req.body.extraToppings.length; i++) {
      await Ingredient.updateOne(
        { _id: req.body.extraToppings[i] }, 
        { $inc: { quantity: -1 }})
    }
  } 
}
// Helper functions
const validateId = async id => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await Pizza.countDocuments({_id: id})) return true
  }
  throw new ResourceNotFoundError(`Could not find a pizza with id ${id}`)
}

const checkInstock = pizza => {
  return !(pizza.ingredients.find(item => item.quantity < 0) || pizza.extraToppings.find(item => item.quantity < 0))
}
const checkOutstock = pizza => {
  return (pizza.ingredients.find(item => item.quantity < 0) || pizza.extraToppings.find(item => item.quantity < 0))
}


module.exports = router