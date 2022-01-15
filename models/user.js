const mongoose = require('mongoose')
const {Schema}=mongoose
const passportLocalMongoose=require('passport-local-mongoose');
const userSchema = new Schema({
    roll:String,
    phone:{
        type:Number,
    },
    email:{
        type:String,
        unique:true,
    },
    batch:String,
    department:String,
})
userSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model('User',userSchema);
