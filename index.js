let express = require('express');
let app = express();
let path = require('path');
const passport = require('passport');
require('./config/passport');
const session = require('express-session');
const  dotenv = require('dotenv');
const { render } = require('ejs');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const { globalErrorHandler,notFound } = require('./middlewares/globalErrorHandler');
const dbConnect = require('./config/dbConnect');
const adminProductRouter = require('./routes/adminProductRoute');
dotenv.config('env');
dbConnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(methodOverride('_method'));
app.use(flash());

//clear cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
  res.setHeader("Pragma", "no-cache"); 
  res.setHeader("Expires", "0");
  next()
});


app.use(session({
  secret: 'yourSecretKeyHere',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



let PORT = process.env.PORT || 3030

// Set view engine and static files
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'public/UserHome')));
app.use(express.static(path.join(__dirname,'public/adminHome')));




// main routes
app.use('/admin', require('./routes/adminRouter'));
app.use('/admin/product',adminProductRouter)


app.use('/', require('./routes/userRouter'));


//sample

app.use('/sample', require('./routes/sampleRoute'));


//Error Handling MiddleWare
app.use(notFound)
app.use(globalErrorHandler)



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});














