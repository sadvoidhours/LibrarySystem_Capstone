const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

module.exports = { signToken };
