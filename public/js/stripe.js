/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51KqCJeCFlsUBNf5QILsOQh8w7xM3XINyTaZeCH0Z32zw00f4bRU3fvdXoCosn9Ceg0kisjWWZdBLgMON8ICscCg500P0w60qH9',
);

export const bookTour = async (tourId) => {
  try {
    // get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // create checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    showAlert('error', err);
  }
};
