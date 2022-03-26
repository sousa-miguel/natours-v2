const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// router.get('/api/v1/tours', getAllTours);
// router.post('/api/v1/tours', createTour);
// router.get('/api/v1/tours/:id', getTour);
// router.patch('/api/v1/tours/:id', updateTour);
// router.delete('/api/v1/tours/:id', deleteTour);

//router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

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
