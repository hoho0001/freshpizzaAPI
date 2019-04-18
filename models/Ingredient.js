const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true, 
    maxlength: 64, 
    required: true },
  price: { 
    type: Number, 
    trim: true, 
    max: 10000,
    default: 100 },
  quantity: { 
    type: Number, 
    trim: true, 
    max: 1000,
    default: 10,
    min: 0 },
  isGlutenFree: { 
    type: Boolean, 
    default: false},
  imageUrl: {
    type: String,
    maxlength: 1024
  },
  categories: [{
    type: String,
    enum:['meat', 'spicy', 'vegitarian', 'vegan', 'halal', 'kosher', 'cheeze', 'seasonings'],
    lowercase: true
  }]
})

const Model = mongoose.model('Ingredient', schema)

module.exports = Model