const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = require('./User')

const messageSchema = new Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    receipient: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    text: String,
    file: String
},{ timestamps: true })

module.exports = mongoose.model('Message', messageSchema)