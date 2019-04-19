const ResourceNotFoundError = require('../../exceptions/ResourceNotFound')
const auth = require('../../middleware/auth')
const sanitizeBody = require('../../middleware/sanitizeBody')
const User = require('../../models/User')
const isStaff = require('../../middleware/isStaff')
const mongoose = require('mongoose');


const express = require('express')
const router = express.Router()


// Register a new user
router.post('/users', sanitizeBody, async (req, res, next) => {
  // Ignore isStaff in request.

  const { isStaff, ...attributes } = req.sanitizedBody
  new User(attributes)
    .save()
    .then(newUser => res.status(201).send({data: newUser}))
    .catch(next)
})

// Login a user and return an authentication token.
router.post('/tokens', sanitizeBody, async (req, res, next) => {
  const {email, password} = req.sanitizedBody
  const user = await User.authenticate(email, password)

  if (!user) {
    return res.status(401).send({errors: [{
      status: 'Unauthorized',
      code: '401',
      title: 'Incorrect username or password.'
    }]})
  }
  res.status(201).send({data: {token: user.generateAuthToken()}})
})

// Get Logged-in User
router.get('/users/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id)
  res.send({data: user})
})

// Update Password
router.patch('/users/me', auth, async (req, res) => {  
  try{
    const user = await User.findById(req.user._id)
    user.password = req.body.password
    await user.save()

    res.send({data: user})
  } catch (err) {
    next(err)
  }
  
})

// Staff Registration - set isStaff for other users ---- OK
router.patch('/users/:id', [auth, isStaff, sanitizeBody], async (req, res, next) => {  
  try{
    await validateId(req.params.id)
    

    const user = await User.findById(req.params.id)
    user.isStaff = true
    await user.save()

    res.send({data: user})
  } catch (err) {
    next(err)
  }
  
})

// Helper functions
const validateId = async id => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await User.countDocuments({_id: id})) return true
  }
  throw new ResourceNotFoundError(`Could not find an user with id ${id}`)
}

module.exports = router