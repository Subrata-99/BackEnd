const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const commentSchema = new mongoose.Schema(
    {
        text: String,
        postedBy:{
            type: ObjectId, 
            ref: "User"
        }
    }
)


const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    likes: [{
        type: ObjectId,
        ref: "User"
    }],
    comments:[commentSchema],
    postedBy: {
        type: ObjectId,
        ref: "User"
    }
},{timestamps: true})

const Post = mongoose.model("Post", postSchema)

module.exports = Post