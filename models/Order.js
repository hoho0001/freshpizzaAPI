const mongoose = require('mongoose')
const Pizza = require('../models/Pizza')

const schema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'},
  type: {
    type: String,
    trim: true,
    lowercase: true,
    enum: ['pickup','delivery'],
    default: 'pickup'
  },
  status: {
    type: String,
    enum: ['draft', 'ordered', 'paid', 'delivered'],
    default: 'draft'  
  },
  pizzas: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pizza'}
    ],
  address: { 
    type: String,
    required: function() {
      return this.type === 'delivery';
      },
      //  if type is delivery -> required
    set: value => value.toLowerCase()
    },
  price: { 
    type: Number, 
    trim: true, 
    default: 0 },
  deliveryCharge: { 
    type: Number, 
    default: function () {
      return this.type === 'delivery'? 500 : 0 },
      set: value => Math.floor(value)},  // 500 if type is delivery
  tax: { 
    type: Number,  
    default: 0,
    set: value => Math.floor(value) },
  total: { 
    type: Number, 
    default: 0,
    set: value => Math.floor(value) },  
},
{ timestamps: true})


schema.pre('save', async function(next) {
  
  //all orders are subject the Ontario HST rate of 13%. 
  //The order price, tax and total should be automatically calculated on save.
  //this.populate('pizzas').exec(Populate)
  this.populatePizza()

})

schema.methods.updatePrice =  function(){ 
  this.price =  this.pizzas.reduce(function(total, pizza){
    return total + pizza.price
  },0)
  this.tax = this.price * 0.13
  this.total = this.price + this.tax + this.deliveryCharge
}

schema.methods.populatePizza = async function() {
   await this.populate('pizzas').execPopulate()
   this.updatePrice()
}

schema.methods.updatePrice1 = function(){
  let order = this
  let temp = order.pizzas.map(product => {
    return { _id: mongoose.Types.ObjectId(product) }
  })
  let total = 0
  let promises = Pizza.find({ _id: { $in: temp } }).exec()
  promises
    .then(data => {
      data.forEach(product => {
        total += product.price
      })
      order.price = total
      order.tax = total * 0.13
      order.total = order.price + order.tax + order.deliveryCharge
      next()
    })
    .catch(err => {
      console.error(err)
    })
}


const Model = mongoose.model('Order', schema)

module.exports = Model


