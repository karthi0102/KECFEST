const mongoose = require('mongoose')
const {Schema}=mongoose

const formSchema = new Schema({
    title:String,
    username:String,
    roll:String,
    email:String,
    phone:Number,
    department:String,
})

module.exports=mongoose.model('Form',formSchema)