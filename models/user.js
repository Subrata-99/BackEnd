const { string } = require('@hapi/joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    expireToken: Date,
    pic: {
        type: String,
        default:"https://res.cloudinary.com/subdas/image/upload/v1602054598/no_pic_mmxhhe.jpg"
    },
    Activate: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model("User", userSchema);

module.exports = User