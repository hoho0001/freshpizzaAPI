const authorize = require('../../middleware/auth')
const sanitizeBody = require('../../middleware/sanitizeBody')
const User = require('../../models/User')
const express = require('express')
const router = express.Router()


// Register a new user
router.post('/users', sanitizeBody, async (req, res, next) => {
  new User(req.sanitizedBody)
    .save()
    .then(newUser => res.status(201).send({data: newUser}))
    .catch(next)
})

// Login a user and return an authentication token.
router.post('/tokens', sanitizeBody, async (req, res, next) => {
  const {email, password} = req.sanitizedBody
  
  if (!user) {
    return res.status(401).send({errors: [{
      status: 'Unauthorized',
      code: '401',
      title: 'Incorrect username or password.'
    }]})
  }
  res.status(201).send({data: {token: user.generateAuthToken()}})
})


router.get('/users/me',authorize, async (req, res) => {
  const user = await User.findById(req.user._id)
  res.send({data: user})
})

router.patch('/users/me',authorize, async (req, res) => {  //change password
  try{
    const user = await User.findById(req.user._id)
    user.password = req.body.password
    await user.save()

    res.send({data: user})
  } catch (err) {
    next(err)
  }
  
})

//or we can call save() in post('findByIdAndUpdate')
// schema.post('findByIdAndUpdate', async function(doc) {
// await doc.save()
//}

module.exports = router