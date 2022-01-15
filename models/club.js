const mongoose = require('mongoose')
const {Schema}= mongoose;
const Symposium = require('./symposium')
const ImageSchema =  new Schema({
    url:String,
    filename:String,
})
const clubSchema = new Schema({
    title:String,
    image:[ImageSchema],
    description:String,
    facultyName:String,
    facultyNumber:Number,
    facultyMail:String,
    studentName:String,
    studentNumber:Number,
    studentMail:String,
    author:{
      type:Schema.Types.ObjectId,
      ref:'User',  
    },
    symposium:[{
        type:Schema.Types.ObjectId,
        ref:'Symposium', 
    }],
    members:[{
        type:Schema.Types.ObjectId,
        ref:'Member'
    }],
    flink:String,
    ilink:String,
})

clubSchema.post('findOneAndDelete', async (data)=>{
  if(data){
      await Symposium.deleteMany({
          _id :{
              $in:data.symposium

          }
      })
  }
})
module.exports=mongoose.model('Club',clubSchema)