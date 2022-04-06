const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Step 1: Create a transporter

  /* Gmail example:
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  */
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Step 2: Define email options
  const mailOptions = {
    from: 'Natours App <natours-app@natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  // Step 3: Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
