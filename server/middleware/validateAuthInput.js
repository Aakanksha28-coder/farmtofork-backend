const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const validateEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

const validatePassword = (password = '') => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasLetter || !hasNumber) {
    return 'Password must contain at least one letter and one number';
  }

  return '';
};

const registerValidator = (req, res, next) => {
  const { name = '', email = '', password = '', confirmPassword = '' } = req.body;

  if (!String(name).trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  if (!String(confirmPassword)) {
    return res.status(400).json({ message: 'Confirm password is required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  req.body.email = normalizeEmail(email);
  req.body.name = String(name).trim();
  next();
};

const loginValidator = (req, res, next) => {
  const { email = '', password = '' } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!String(password)) {
    return res.status(400).json({ message: 'Password is required' });
  }

  req.body.email = normalizeEmail(email);
  next();
};

const otpEmailValidator = (req, res, next) => {
  const { email = '' } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  req.body.email = normalizeEmail(email);
  next();
};

const otpVerificationValidator = (req, res, next) => {
  const { email = '', otp = '' } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!/^\d{6}$/.test(String(otp).trim())) {
    return res.status(400).json({ message: 'OTP must be a 6-digit code' });
  }

  req.body.email = normalizeEmail(email);
  req.body.otp = String(otp).trim();
  next();
};

module.exports = {
  registerValidator,
  loginValidator,
  otpEmailValidator,
  otpVerificationValidator
};
