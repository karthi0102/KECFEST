const mongoose = require('mongoose')
const {Schema}=mongoose
const ImageSchema =  new Schema({
    url:String,
    filename:String,
})
const memberSchema = new Schema({
   image:[ImageSchema],
   name:String,
   position:String,
   department:String,
})

module.exports=mongoose.model('Member',memberSchema)