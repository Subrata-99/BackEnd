const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const bcrypt = require('bcryptjs');
const crypto =require('crypto')
const jwt = require('jsonwebtoken');
const validation = require('../middleware/validation');
const mailgun = require('nodemailer-mailgun-transport');
// const DOMAIN = 'sandbox0b39d66178eb438e84c5ec530dc3ccb6.mailgun.org';
// const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN});

const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { findOne, findOneAndUpdate } = require('../models/post');

const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    post: 2525,
    auth: {
        user: "8bcb0c9ccbb46f",
        pass: "c67f76dfaec040",
    }
})

router.post('/signup', validation, (req, res) => {
    const { email , password,  name, pic } = req.body;
    if(!email || !password || !name) {
        return res.status(422).json({error: "Please add all the fields"});
    }
    User.findOne({email: email})
    .then((savedUser) => {
        if(savedUser) {
            return res.status(422).json({error: "User already exists with that email"});
        }
        bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email,
                password: hashedPassword,
                name,
                pic
            })
    
            user.save()
            .then(user =>{
                const token = jwt.sign({ name, email}, process.env.ACC_ACTIVATE, {expiresIn: '30m'})

               const mailBody = {
                to:user.email,
                from:"dasbro9@gmail.com",
                subject:"Account Activation Link",
                html:`
                    <h2>Please click on given link to activate your account</h2>
                    <h5><a href="http://localhost:3000/activate/${token}">link</a></h5>
                `
               }
               transporter.sendMail(mailBody,(err,info) => {
                   if(err) {
                       console.log(err)
                   }else {
                       console.log("Email sent: "+ info.response)
                   }
               })
               res.json({message: "saved successfully, check your email"})
            })
            .catch(err => {
                console.log(err)
            })
        })
        
    })
    .catch(err => {
        console.log(err)
    })
})

router.post("/activation", (req, res) => {
    const { token } = req.body
    if(token) {
        jwt.verify(token, process.env.ACC_ACTIVATE, async (err, decodedToken) => {
            if(err) {
                return res.json({error: "Incorrect or Expired Token !"})
            }
            const { email } = decodedToken
            await User.findOneAndUpdate( {email: email},{$set:{Activate: true}}, (err, result) => {
                if(err) {
                    return res.json({error: err})
                }
                res.status(200).json({message: "Account activated !"})
            })
            
        })
    }
})

router.post('/signin', (req, res)=> {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(422).json({error: "Please add all the fields"})
    }
    User.findOne({email})
    .then(savedUser => {
        console.log(savedUser)
        if(!savedUser) {
            return res.status(422).json({error: "Invalid email or password"})
        }
        if(!savedUser.Activate) {
            return res.status(422).json({error: "Your account is not activated "})
        }
        bcrypt.compare(password, savedUser.password)
        .then(doMatch => {
            if(doMatch) {
                const token = jwt.sign({_id: savedUser._id}, process.env.JWT_SECRET)
                const {_id, name, email, pic} = savedUser
                res.json({token, user:{_id, name, email, pic}});
                //res.json({message: "successfully signed in"})
            }
            else {
                return res.status(422).json({error: "Invalid email or password"})
            }
        })
        .catch(err => {
            console.log(err)
        })
    })
})

router.post("/reset-password", async(req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                return res.status(422).json({error:"User with this email does not exist"})
            }
            user.resetToken = token
            user.expireToken = Date.now() + 3600000
            user.save().then((result) => {
                transporter.sendMail({
                    to:user.email,
                    from:"dasbro9@gmail.com",
                    subject:"Reset Password Link",
                    html:`
                        <h2>Please click on given link to reset your password</h2>
                        <h5><a href="http://localhost:3000/reset/${token}">link</a></h5>
                    `
                })
                res.json({ message: 'Email has been sent, kindly follow the instructions' })
            })
        })
    })
})

router.post("/new-password", (req, res) => {
    const newPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({resetToken: sentToken, expireToken:{$gt:Date.now()}})
    .then(user => {
        if(!user) {
            return res.status(422).json({error:"Incorrect or Expired Token !"})
        }
        bcrypt.hash(newPassword,12).then(hashedPassword => {
            user.password = hashedPassword
            user.resetToken = undefined
            user.expireToken = undefined
            user.save().then(saveduser => {
                res.json({message: "Your password has been changed"})
            })
        })
    }).catch(err => {
        console.log(err)
    })
})

module.exports = router

