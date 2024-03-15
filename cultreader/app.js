const mongoose = require("mongoose");
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const router = express.Router();
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog");

const mongoDB = process.env.MONGODB_URI;

const app = express();

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
app.use(limiter);

app.use(compression());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter);

app.use('/admin', router, (req, res) => {
  res.sendStatus(401);
})

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

main().catch((err) => console.log(err));

async function main() {
  console.log('Attempting to connect to MongoDB...');
  await mongoose.connect(mongoDB);
  console.log('Connected to MongoDB successfully!');
}

module.exports = app;
