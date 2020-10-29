const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const protect = require('../middleware/protect')
const Post = require('../models/post')

router.get("/allpost",protect, (req, res) => {
    Post.find()
    .populate("comments.postedBy","_id name")
    .populate("postedBy","_id name pic")
    .sort("-createdAt")
    .then(posts => {
        res.json({posts})
    })
    .catch(err => {
        console.log(err)
    })
})

router.get("/mypost",protect, (req, res) => {
    Post.find({postedBy: req.user._id})
    .populate("postedBy", "_id name pic")
    .then(mypost => {
        console.log()
        res.json(mypost)
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/createpost',protect, (req, res) => {
    const { title, body, pic } = req.body
    if(!title || !body || !pic) {
        return res.status(422).json({error: "Please add all the fields"})
    }
    req.user.password = undefined 
    const post = new Post({
        title,
        body,
        photo:pic,
        postedBy: req.user
    })
    post.save().then(result => {
        res.json({post: result})
    })
    .catch(err => {
        console.log(err)
    })
})

router.put('/like',protect, (req,res)=> {
    Post.findByIdAndUpdate(req.body.postId,{
        $push:{likes: req.user._id}
    },{
        new:true
    }).populate("postedBy", "_id name pic")
    .exec((err,result) => {
        if(err) {
            return res.status(422).json({error: err})
        } else {
            res.json(result)
        }
    })
})

router.put('/unlike',protect, (req,res)=> {
    Post.findByIdAndUpdate(req.body.postId,{
        $pull:{likes: req.user._id}
    },{
        new:true
    }).populate("postedBy", "_id name pic")
    .exec((err,result) => {
        if(err) {
            return res.status(422).json({error: err})
        } else {
            res.json(result)
        }
    })
})

router.put('/comment',protect, (req,res)=> {
    const comment = {
        text:req.body.text,
        postedBy:req.user._id
    }
    Post.findByIdAndUpdate(req.body.postId,{
        $push:{comments: comment}
    },{
        new:true
    })
    .populate("comments.postedBy","_id name")
    .populate("postedBy","_id name")
    .exec((err,result) => {
        if(err) {
            return res.status(422).json({error: err})
        } else {
            res.json(result)
        }
    })
})

router.delete('/deletepost/:postId',protect, (req, res) =>{
    Post.findByIdAndDelete({_id:req.params.postId})
    .populate("comments.postedBy","_id")
    .populate("postedBy","_id name")
    .exec((err,post)=>{
        if(err || !post){
            return res.status(422).json({error: err})
        }
        if(post.postedBy._id.toString() === req.user._id.toString()){
             post.remove()
             .then(result => {
                 res.json({message: "Successfully deleted"})
             }).catch(err=> {
                 console.log(err)
             })
        }
    })
})

router.delete('/deletecomment/:postId/:commentId', protect, async (req, res) =>{ 
    try {
        const post = await Post.findById(req.params.postId)

        const comment = post.comments.find(comment => comment.id === req.params.commentId)

        if(!comment) {
            return res.status(404).json({ message: 'Comment does not exist'})
        }

        if(comment.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized'})
        }
        const removeIndex = post.comments
        .map(comment => comment.postedBy.toString())
        .indexOf(req.user.id)

        post.comments.splice(removeIndex, 1)

        await post.save()
        res.json(post.comments)

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})
    


module.exports = router;