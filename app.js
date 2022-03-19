// Core modules
const fs = require('fs');
// External modules
const express = require('express');

const app = express();

app.use(express.json()); // middleware - a function to modify incoming request data

// app.get('/', (req, res) => {
//   res
//     .status(200) // 200 is the default
//     .json({ message: 'Hello from the server side! 👋', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('ayy');
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// routes
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours, // if key and value and have same name no need to type both (ES6)
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

app.get('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Tour not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// Start up server
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
