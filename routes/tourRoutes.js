const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// router.get('/api/v1/tours', getAllTours);
// router.post('/api/v1/tours', createTour);
// router.get('/api/v1/tours/:id', getTour);
// router.patch('/api/v1/tours/:id', updateTour);
// router.delete('/api/v1/tours/:id', deleteTour);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
