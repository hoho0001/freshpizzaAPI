const ResourceNotFoundError = require('../exceptions/ResourceNotFound')
const sanitizeBody = require('../middleware/sanitizeBody')
const Ingredient = require('../models/Ingredient')


// const auth = require('../middleware/auth')
// const admin = require('../middleware/isStaff')
const Pizza = require('../models/Pizza')
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  const pizzas = await Pizza.find()
  res.send({data: pizzas})
})

router.post('/',sanitizeBody, async (req, res, next) => {
  
  //check Ingredients:
  if (req.body.ingredients) {
    for (let i = 0; i < req.body.ingredients.length; i++) {
      const ingredient =  await Ingredient.findById(req.body.ingredients[i]);
      if (!ingredient) return res.status(400).send('Invalid Ingredient.');
      if (ingredient.quantity <= 0) return res.status(400).send('Ingredient not in stock.');
    }
  } 
  
  new Pizza(req.sanitizedBody).save()
    .then(newPizza => {
      updateIngredients(req)
      console.log("Pizza")
      console.log(newPizza)
      res.status(201).send({data: newPizza})})
    .catch (next)
})

router.get('/:id', async (req, res) => {
  try {
    const pizza = await Pizza.findById(req.params.id).populate('ingredients').populate('extraToppings')
    
    if (!pizza) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
})

const update = (overwrite = false) => async (req, res) => {
  try {
    const pizza = await Pizza.findByIdAndUpdate(
      req.params.id,
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
    checkIngredients()
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
}
router.put('/:id',  update((overwrite = true)))
router.patch('/:id',  update((overwrite = false)))

router.delete('/:id', async (req, res) => {
  try {
    const pizza = await Pizza.findByIdAndRemove(req.params.id)
    if (!pizza) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    res.send({data: pizza})
  } catch (err) {
    next(err)
  }
})

router.delete('/', async (req, res) => {
  try {
    const order = await Pizza.deleteMany()
    if (!order) throw new ResourceNotFoundError(
      `We could not find a pizza with id: ${req.params.id}`
    )
    res.send({data: order})
  } catch (err) {
    next(err)
  }
})

const checkIngredients = async function(req,res){
  if (req.body.ingredients) {
    console.log('check ')
    for (let i = 0; i < req.body.ingredients.length; i++) {
      const movie =  await Ingredient.findById(req.body.ingredients[i]);
      if (!movie) return res.status(400).send('Invalid Ingredient.');
      if (movie.quantity <= 0) return res.status(400).send('Ingredient not in stock.');
    }
  } 
}
const updateIngredients = async function(req){
  if (req.body.ingredients) {
    for (let i = 0; i < req.body.ingredients.length; i++) {
      
      await Ingredient.updateOne(
        { _id: req.body.ingredients[i] }, 
        { $inc: { quantity: -1 }})

        console.log(req.body.ingredients[i])
    }
  } 
}


module.exports = router