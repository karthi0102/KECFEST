const mongoose = require('mongoose')
const {Schema}=mongoose
const Event = require('./event')
const ImageSchema =  new Schema({
    url:String,
    filename:String,
})
const symposiumSchema = new Schema({
    title:String,
    image:[ImageSchema],
    description:String,
    mode:{
        type:String,
        enum:['offline','online'],
    },
    duration:String,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    events:[{
        type:Schema.Types.ObjectId,
        ref:'Event'
    }],
    feeds:[{
        type:Schema.Types.ObjectId,
        ref:'Feedback',
    }],
    club:{
        type:Schema.Types.ObjectId,
        ref:'Club'
    }
})

symposiumSchema.post('findOneAndDelete', async (data)=>{
    if(data){
        await Event.deleteMany({
            _id :{
                $in:data.events
  
            }
        })
    }
  })
module.exports = mongoose.model('Symposium',symposiumSchema)
