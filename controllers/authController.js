const { promisify } = require('util');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const getHashedToken = require('../utils/hashToken');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove fields from output
  user.password = undefined;
  user.isPendingConfirmation = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
  });

  // const confirmURL = `${req.protocol}://${req.get(
  //   'host',
  // )}/api/v1/users/confirmMyAccount/${user.confirmationToken}`;

  // const message = `Confirm your user account by submitting a PATCH request using the following URL: ${confirmURL}`;

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Account confirmation',
  //     message,
  //   });

  //   res.status(200).json({
  //     status: 'success',
  //     message: 'Confirmation email has been sent!',
  //   });
  // } catch (err) {
  //   return next(
  //     new AppError(
  //       'There was an error sending the email. Please, try again later',
  //       500,
  //     ),
  //   );
  // }
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Step 1: Check if email and password exist
  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));

  // Step 2: Check if user exists && password is correct
  const user = await User.findOne({ email }).select(
    '+password +isPendingConfirmation +active',
  );
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  // Step 3: Check account is confirmed
  if (user.isPendingConfirmation)
    return next(new AppError('Please confirm your account', 401));

  // Step 4: Check if account is active
  if (!user.active)
    return next(new AppError('Your account is not active', 401));

  // Step 5: If everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // Step 1: Get token and check if exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );

  // Step 2: Verificate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Step 3: Check user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(new AppError('The user no longer exists...', 401));

  // Step 4: Check user changed password after token was issued
  if (await freshUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('You recently changed password. Please log in again!', 401),
    );

  // GRANT ACCESS
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

// Only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      if (!req.cookies.jwt)
        return next(
          new AppError(
            'You are not logged in! Please log in to get access',
            401,
          ),
        );

      // Step 2: Verificate token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // Step 3: Check user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser)
        return next(new AppError('The user no longer exists...', 401));

      // Step 4: Check user changed password after token was issued
      if (await freshUser.changedPasswordAfter(decoded.iat))
        return next(
          new AppError(
            'You recently changed password. Please log in again!',
            401,
          ),
        );

      // THERE IS A LOGGED IN USER
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array ['admin'], ['lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Step 1: Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('Email not found', 404));

  // Step 2: Generate random token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Step 3: Send it to user email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password reset token (valid for ${process.env.RESET_TOKEN_EXPIRES}mins)`,
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please, try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Step 1: Get user based on token
  const hashedToken = getHashedToken('sha256', req.params.token, 'hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // Step 2: If token has not expired and user is valid, set new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Step 3: Log in user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Step 1: get user
  const user = await User.findById(req.user.id).select('+password');

  // Step 2: check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  // Step 3: update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Step 4: log user in
  createSendToken(user, 200, res);
});

// exports.confirmAccount = catchAsync(async (req, res, next) => {
//   // Step 1: Get user based on token
//   const { token } = req.params;

//   const user = await User.findOne({
//     confirmationToken: token,
//   }).select('+isPendingConfirmation');

//   // Step 2: Check user is found
//   if (!user) return next(new AppError('Token is invalid', 400));

//   user.confirmationToken = undefined;
//   user.isPendingConfirmation = false;

//   await user.save({ validateBeforeSave: false });

//   // Step 3: Log in user
//   createSendToken(user, 200, res);
// });
