// External modules
const express = require('express');
const morgan = require('morgan');
// Internal modules
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

////////////////////////////////////
// GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}
app.use(express.json()); //  a function to modify incoming request data
//app.use(express.static(`${__dirname}/public`)); // serving static files

app.use((req, res, next) => {
  console.log('I came from the middleware 🍓');
  next(); // continue the response cycle
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

////////////////////////////////////
// ROUTES
app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

module.exports = app;
