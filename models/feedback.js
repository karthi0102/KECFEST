const mongoose = require('mongoose')
const {Schema}=mongoose

const feedSchema = new Schema({
    body:String,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User',
    }
})

module.exports=mongoose.model('Feedback',feedSchema)