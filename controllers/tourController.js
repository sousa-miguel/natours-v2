const Tour = require('../models/tourModel');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      requestedAt: req.requestTime,
      message: 'Invalid body format (missing name or price)',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    // results: tours.length,
    // data: {
    //   tours, // if key and value and have same name no need to type both (ES6)
    // },
  });
};

exports.getTour = (req, res) => {
  //const id = req.params.id * 1;
  //const tour = tours.find((el) => el.id === id);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    // data: {
    //   tour,
    // },
  });
};

exports.createTour = (req, res) => {};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: {
      tour: 'Not implemented...',
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: null,
  });
};
