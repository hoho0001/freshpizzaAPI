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


schema.pre('save', async function() {
  await this.updatePrice()
})

schema.post('findByIdAndUpdate', async function(doc){
  doc.save()
})

const reducer = (total, item) => total + item.price

schema.methods.populateIngredients = async  function() {
  await this.populate('ingredients').populate('extraToppings').execPopulate()
}

schema.methods.updatePrice = async function(){
  await this.populateIngredients()
  this.price = await this.ingredients.reduce(reducer,0) + this.extraToppings.reduce(reducer,0)
}

schema.methods.updatePrice_Old = function(){
  // let temp = this.ingredients.map(product => {
  //   return { _id: mongoose.Types.ObjectId(product) }
  // }).concat(this.extraToppings.map(product => {
  //   return { _id: mongoose.Types.ObjectId(product) }
  // }))

  // let total = 0
  // let promises = Ingredient.find({ _id: { $in: temp } }).exec()
  // promises
  //   .then(data => {
  //     data.forEach(product => {
  //       total += product.price
  //     })
  //     newPizza.price = total
  //     console.log(this)
  //     next()
  //   })
  //   .catch(err => {
  //     console.error(err)
  //   })
}


const Model = mongoose.model('Pizza', schema)

module.exports = Model