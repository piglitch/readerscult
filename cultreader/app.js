var createError = require('http-errors');
var express = require('express');
var path = require('path');
const router = express.Router()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");


//const dev_db_url = "mongodb+srv://avibanerjee:uuM0ds7r8xYuaAen@cluster0.d8wx0hs.mongodb.net/readercult?retryWrites=true&w=majority"
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog");

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI

var app = express();

// function getUrl(req){
//   let fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
//   console.log('Server is up at: ', fullUrl);
// }

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    },
  }),
);

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

app.use(compression()); // Compress all routes

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter);

app.use('/admin', router, (req, res) => {
  res.sendStatus(401);
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

main().catch((err) => console.log(err));
async function main(){
  await mongoose.connect(mongoDB);
  console.log('connected to readercult...');
}



module.exports = app;