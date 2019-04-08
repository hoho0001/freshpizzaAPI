const mongoose = require('mongoose')
const Ingredient = require('../models/Ingredient')


const schema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true, 
    minlength: 4, 
    maxlength: 64, 
    required: true },
  price: { 
    type: Number, 
    trim: true, 
    min: 1000, 
    max: 10000, 
    default: 1000,
    set: value => Math.floor(value)},
  size: { 
    type: String, 
    enum: ['small', 'medium', 'large', 'extra large'], 
    default: 'small' },
  isGlutenFree: { 
    type: Boolean, 
    default: false},
  imageUrl: { 
    type: String, 
    trim: true, 
    maxlength: 1024 },
  ingredients: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient'}],
  extraToppings: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient'}]
})


schema.pre('save', async function(next) {
  let newPizza = this
  
  let temp = newPizza.ingredients.map(product => {
    return { _id: mongoose.Types.ObjectId(product) }
  }).concat(newPizza.extraToppings.map(product => {
    return { _id: mongoose.Types.ObjectId(product) }
  }))
  
  let total = 0
  let promises = await Ingredient.find({ _id: { $in: temp } })
  
  promises.forEach(product => {
        total += product.price
      })
  newPizza.price = parseInt(total)
  
  console.log(newPizza)
  next()
})


const reducer = (total, item) => total + item.price


schema.methods.populateIngredients = async function() {
  await this.populate('extraToppings').execPopulate()

  //  await this.populate('extraToppings').execPopulate()
  // this.price =  
  console.log(await this.ingredients.reduce(reducer,0))
  //  + await this.extraToppings.reduce(reducer,0)
}

schema.methods.updatePrice = function(){
  let temp = this.ingredients.map(product => {
    return { _id: mongoose.Types.ObjectId(product) }
  }).concat(this.extraToppings.map(product => {
    return { _id: mongoose.Types.ObjectId(product) }
  }))

  let total = 0
  let promises = Ingredient.find({ _id: { $in: temp } }).exec()
  promises
    .then(data => {
      data.forEach(product => {
        total += product.price
      })
      newPizza.price = total
      console.log(this)
      next()
    })
    .catch(err => {
      console.error(err)
    })
}


const Model = mongoose.model('Pizza', schema)

module.exports = Model