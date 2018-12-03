const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const promisify = require('es6-promisify');
const flash = require('connect-flash');
const expressValidator = require('express-validator');
const routes = require('./routes/index');
const helpers = require('./helpers');
const errorHandlers = require('./handlers/errorHandlers');
const methodOverride = require('method-override');
require('./handlers/passport');

// create our Express index
const index = express();


// view engine setup
index.set('views', path.join(__dirname, 'views')); // this is the folder where we keep our pug files
index.set('view engine', 'pug'); // we use the engine pug, mustache or EJS work great too
// index.set('music', path.join(__dirname, 'music.json'))

index.use(methodOverride('_method'));// override with POST having ?_method=DELETE

// Takes the raw requests and turns them into usable properties on req.body
index.use(bodyParser.json());
index.use(bodyParser.urlencoded({ extended: true }));

// Exposes a bunch of methods for validating data. Used heavily on userController.validateRegister
index.use(expressValidator());

// populates req.cookies with any cookies that came along with the request
index.use(cookieParser());

// Sessions allow us to store data on visitors from request to request
// This keeps users logged in and allows us to send flash messages
index.use(session({
  secret: process.env.SECRET,
  key: process.env.KEY,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// // Passport JS is what we use to handle our logins
index.use(passport.initialize());
index.use(passport.session());

// // The flash middleware let's us use req.flash('error', 'Shit!'), which will then pass that message to the next page the user requests
index.use(flash());

// pass variables to our templates + all requests
index.use((req, res, next) => {
  res.locals.help = helpers;//locals r all the variables available to u on ur template
  res.locals.flashes = req.flash();
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
});

// promisify some callback based APIs
index.use((req, res, next) => {
  req.login = promisify(req.login, req);
  next();
});

// After allllll that above middleware, we finally handle our own routes!
index.use('/', routes);

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
index.use(express.static(path.join(__dirname, 'public')));

// If that above routes didnt work, we 404 them and forward to error handler
index.use(errorHandlers.notFound);

// One of our error handlers will see if these errors are just validation errors
index.use(errorHandlers.flashValidationErrors);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (index.get('env') === 'development') {
  /* Development Error Handler - Prints stack trace */
  index.use(errorHandlers.developmentErrors);
}

// production error handler
index.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = index;
