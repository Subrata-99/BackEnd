const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const protect = require('../middleware/protect')
const Post = mongoose.model("Post")
const User = require('../models/user')

router.get("/user/:id", protect, (req, res) => {
    User.findOne({_id: req.params.id})
    .select("-password")
    .then(user => {
        Post.find({postedBy: req.params.id})
        .populate("postedBy", "_id name pic")
        .exec((err, posts) => {
            if(err) {
                return res.status(422).json({error: err})
            }
            res.json({user, posts})
        })
    }).catch(err => {
        return res.status(404).json({error: "User not found"})
    })
})

router.put("/updatepic", protect, (req, res) => {
    User.findByIdAndUpdate( req.user._id,{$set: {pic: req.body.pic}},{new: true}, (err, result) => {
        if(err) {
            return res.status(422).json({error: "Pic can not be posted"})
        }
        res.json(result)
    })
})

module.exports = router