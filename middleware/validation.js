const Joi = require('@hapi/joi')

authSchema = Joi.object().keys({ 
    name: Joi.string().min(6).max(16).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().alphanum().min(4).max(12).required().strict(),
    pic: Joi.optional()
  })

const validation = async (req, res, next) => {
    try {
       await authSchema.validateAsync(req.body)
    } catch(error) {
        return res.json({error: error.details[0].message})
    }
    next()
}

module.exports = validation