const path = require('path');
// External modules
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
// Internal modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

////////////////////////////////////
// GLOBAL MIDDLEWARES

// Implement CORS
app.use(cors()); // Access-Control-Allow-Origin *
app.options('*', cors());

// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet());

// Developement Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // allow 100 requests from same IP per hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

// Limit number of requests per IP / hour
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse data coming from Form
app.use(cookieParser());

// Data sanatization against NOSQL query injection
app.use(mongoSanitize());

// Data sanatization against XSS
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    // array of fields allowed to be duplicated
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// app.use((req, res, next) => {
//   console.log('I came from the middleware 🍓');
//   next(); // continue the response cycle
// });

// // Test middleware...
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

app.use(compression());

////////////////////////////////////
// ROUTES
const apiPath = '/api/v1/';
app.use('/', viewRouter);
app.use(`${apiPath}tours`, tourRouter);
app.use(`${apiPath}users`, userRouter);
app.use(`${apiPath}reviews`, reviewRouter);
app.use(`${apiPath}bookings`, bookingRouter);

// if we are able to reach this point it means the url is invalid
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
