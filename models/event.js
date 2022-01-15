const mongoose = require('mongoose')
const {Schema} = mongoose;
const Form = require('./form')
const ImageSchema =  new Schema({
    url:String,
    filename:String,
})
const eventSchema = new Schema({
    title:String,
    image:[ImageSchema],
    rules:String,
    skill:{
        type:String,
        enum:['Technical','Non-Technical'],
    },
    studentName:String,
    studentNumber:Number,
    studentMail:String,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    forms:[{
        type:Schema.Types.ObjectId,
        ref:'Form'
    }]
})

eventSchema.post('findOneAndDelete', async (data)=>{
    if(data){
        await Form.deleteMany({
            _id :{
                $in:data.forms
  
            }
        })
    }
  })
  module.exports=mongoose.model('Event',eventSchema)