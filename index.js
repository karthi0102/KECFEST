
if (process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path=require('path')
const ejsMate=require('ejs-mate');
const mongoose = require('mongoose')
const Club = require('./models/club')
const Symposium =require('./models/symposium')
const User = require('./models/user')
const Form = require('./models/form')
const Member = require('./models/members')
const Feedback=require('./models/feedback')
const Event = require('./models/event')
const session = require('express-session');
const passport=require('passport');
const flash = require('connect-flash')
const {clubSchema,sympSchema} = require('./schema.js')
const ExpressError=require('./utils/ExpressError')
const catchAsync =require('./utils/catchAsync');
const LocalStrategy=require('passport-local')
const methodOverride=require('method-override');
const multer  = require('multer')
const {storage}=require('./cloudinary')
const upload = multer({storage })
const MongoStore = require('connect-mongo')
const mongoSanitize = require('express-mongo-sanitize');
const req = require('express/lib/request');
const { request } = require('http');
const { populate } = require('./models/form');
const secret = process.env.SECRET||'thisisasecret'
const db=process.env.DB_URL||'mongodb://localhost:27017/KecFest'
mongoose.connect(db,{useNewUrlParser:true,useUnifiedTopology:true})
.then( () => {
    console.log("Connection open")
}).catch(err => {
    console.log("OOPS !! ERROR")
})
app.engine('ejs',ejsMate)
app.set("view engine",'ejs')
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(methodOverride('_method'))
const store=new  MongoStore({
    mongoUrl:db,
    secret,
    ttl:24*60*60
})
store.on('error',(e)=>{
    console.log("Session store error")
})
const sessionConfig = {
    store,
    secret,
    name:'KECFEST',
    resave:false,
    saveUnitialized:true,
    cookie:{
        httpOnly:true,
        // secure:true,
        expires:Date.now()+1000*60*60*32*7,
        maxAge:1000*60*60*32*7,
    }
}
app.use(mongoSanitize({
    replaceWith: '_'
}))
app.use(flash())
app.use(session(sessionConfig))
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use((req,res,next)=>{
    res.locals.currentUser=req.user
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
})

const isLoggedIn = async(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnTo=req.originalUrl
        req.flash('error','You must Login first');
        return res.redirect('/login');
    }
    next();
}
const validateClub=(req,res,next) => {
    const {error}= clubSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400)
    }else{
        next();
    }
}
const validateSymp=(req,res,next) => {
    const {error}= sympSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400)
    }else{
        next();
    }
}

app.get('/',(req,res)=>{
    res.render('home.ejs')
})

app.get('/clubs',async(req,res)=>{
    const clubs = await Club.find({})
    res.render('clubs',{clubs})
})

app.get('/clubs/new',isLoggedIn,(req,res)=>{
    res.render('clubNew')
})

app.get('/clubs/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const club = await Club.findById(id).populate('author').populate('symposium').populate('members');
    res.render('clubShow',{club})
})

app.post('/clubs',isLoggedIn,upload.array('image'),validateClub,async(req,res)=>{
    const club =new Club(req.body.clubs)
    club.image= req.files.map(f=>({url:f.path,filename:f.filename}))
    club.author=req.user._id;
    await club.save()
    req.flash('success','New club has been created')
    res.redirect('/clubs')
})
app.get('/clubs/:id/edit',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const club = await Club.findById(id);
    await club.save();
    res.render('editClub',{club})
})
app.put('/clubs/:id/edit',isLoggedIn,validateClub,async(req,res)=>{
    const {id}=req.params;
    const club= await Club.findByIdAndUpdate(id,{...req.body.clubs})
    await club.save();
    req.flash('success','Club has been edited')
    res.redirect(`/clubs/${club._id}`);
})
app.delete('/clubs/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const club = await Club.findByIdAndDelete(id);
    req.flash('success','Club has been deleted')
    res.redirect('/clubs')
})
app.get('/symposium',async (req,res)=>{
    const symposium = await Symposium.find({});
    res.render('symposium',{symposium})
})

app.get('/symposium/:id/new',isLoggedIn,async(req,res)=>{
    const {id}=req.params
    res.render('symposiumNew',{id})
})

app.get('/symposium/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const symp = await Symposium.findById(id).populate('author').populate("club").populate({path:'events',populate:{
        path:'forms'
    }})
    res.render('sympShow',{symp})
})


app.post('/symposium/:id',isLoggedIn,upload.array('image'),validateSymp,async(req,res)=>{
    const {id}=req.params;
    const club = await Club.findById(id);
    const symposium = new Symposium(req.body.symp);
    symposium.image= req.files.map(f=>({url:f.path,filename:f.filename}));
    symposium.club=club._id;
    symposium.author=req.user._id;
    club.symposium.push(symposium);
    await symposium.save();
    await club.save();
    await symposium.save();
    req.flash('success','New symposium has been created')
    res.redirect('/symposium')
})
app.delete('/symposium/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const symp = await Symposium.findByIdAndDelete(id);
    req.flash('success','Symposium has been deleted')
    res.redirect('/symposium')
})
app.get('/events/:id/new',isLoggedIn,(req,res)=>{
    const {id}=req.params;
    res.render('eventNew',{id})
})
app.post('/events/:id',isLoggedIn,upload.array('image'),async(req,res) => {
    const {id}=req.params;
    const symp = await Symposium.findById(id);
    const event = new Event(req.body.event);
    event.image= req.files.map(f=>({url:f.path,filename:f.filename}));
    event.author=req.user._id;
    symp.events.push(event);
    await event.save();
    await symp.save();
    req.flash('success','New Event is added')
    res.redirect(`/symposium/${id}`)
})
app.delete('/events/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const event = await Event.findByIdAndDelete(id)
    req.flash('success','Event has been deleted')
    res.redirect('/symposium');
})
app.get('/events/:id/register',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const event = await Event.findById(id);
    const userId=req.user._id;
    const user = await User.findById(userId);
    res.render('registerEvent.ejs',{event,user})
})

app.post('/register/:id/events',isLoggedIn,async(req,res)=>{
    const {id} = req.params
    const event = await Event.findById(id);
    const form = new Form(req.body.forms);
    event.forms.push(form)
    await form.save();
    await event.save();
    req.flash('success','You have successfully registered')
    res.redirect(`/symposium`)
 })
 app.get('/forms/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const event = await Event.findById(id).populate('forms');
    res.render('application',{event})
 })
app.get('/feedback/:id',isLoggedIn,(req,res)=>{
    const {id}=req.params;
    res.render('feedback',{id})
})
app.post('/feedback/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    const {body}=req.body
    const symp = await Symposium.findById(id);
    const feed = new Feedback({body});
    symp.feeds.push(feed)
    feed.author=req.user._id;
    await symp.save();
    await feed.save();
    req.flash('success','Thanks for the feedback');
    res.redirect('/symposium')
})

app.get('/feedback/:id/show',isLoggedIn,async(req,res)=>{
    const {id}=req.params
    const symp=await Symposium.findById(id).populate({path:'feeds',populate:{path:'author'}})
    res.render('feedshow',{symp})
})

app.get('/members/:id',isLoggedIn,(req,res)=>{
    const {id}=req.params;
    res.render('member',{id});
})
app.post('/members/:id',isLoggedIn,upload.array('image'),async(req,res)=>{
        const {id}=req.params;
        const club =await Club.findById(id);
        const member = new Member(req.body.members);
        member.image= req.files.map(f=>({url:f.path,filename:f.filename}));
        club.members.push(member);
        await member.save();
        await club.save();
        req.flash('success','Member has been added successfully');
        res.redirect(`/clubs/${id}`)
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.post('/register',async(req,res)=>{
    try{
    const {email,username,password,confirm,roll,batch,phone,department}=req.body;
    if(confirm!=password){
        req.flash('error',"Confirm your password");
        return res.redirect('/register')
    }
    const user = new User({username,roll,email,batch,phone,department})
    const newUser=await User.register(user,password);
    req.login(newUser,err =>{
        if(err) return next(err);
        req.flash('success','Welcome to KECFEST');
        return res.redirect('/');
    })
    }catch(e){
        req.flash('error',e.message);
        res.redirect('/register')
    }
})

app.get('/login',(req,res)=>{
    res.render('login')
})
app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    req.flash('success',`Welcome Back`);
    res.redirect('/clubs');
})
app.get('/logout',(req,res)=>{
    req.logOut();
    req.flash('success',"GOODBYE ");
    res.redirect('/');
})

app.all('*',(req,res,next) => {
    next(new ExpressError('Page Not Found',404))
})
app.use((err,req,res,next) => {
    const {statusCode=500} = err;
    if(!err.message) err.message='something went wrong';
    res.status(statusCode).render('error.ejs',{err});
})
const port = process.env.PORT||8080
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})