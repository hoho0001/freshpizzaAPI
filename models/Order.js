const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true},
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


schema.pre('save', async function() {
  
  //all orders are subject the Ontario HST rate of 13%. 
  await this.updatePrice()

})
schema.post('findOneAndUpdate', async function(doc){
  if (doc){
    await doc.save()
  }
})

schema.methods.updatePrice =  async function(){ 
  await this.populatePizza()
  this.price = await this.pizzas.reduce(reducer,0)
  
  this.tax = this.price * 0.13
  this.total = this.price + this.tax + this.deliveryCharge
}

schema.methods.populatePizza = async function() {
   await this.populate('pizzas').execPopulate()
}


const reducer = (total, item) => total + item.price

const Model = mongoose.model('Order', schema)

module.exports = Model