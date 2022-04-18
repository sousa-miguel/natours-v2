/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type can be 'success' or 'error'
export const showAlert = (type, msg) => {
  // close alerts before opening a new one
  hideAlert();
  // alert markup
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  // render alert
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  // close alert after 5 seconds
  window.setTimeout(hideAlert, 5000);
};
