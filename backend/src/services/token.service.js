const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

const durationToMs = (value) => {
  const match = String(value || '').trim().match(/^(\d+)([smhdw])$/i);

  if (!match) {
    return 0;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * (multipliers[unit] || 0);
};

const hashToken = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const issueAccessToken = (user) => jwt.sign(
  {
    sub: user._id,
    role: user.role,
    email: user.email,
    tv: user.tokenVersion || 0
  },
  process.env.JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_EXPIRES_IN, jwtid: crypto.randomUUID() }
);

const issueRefreshToken = async (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      sub: user._id,
      role: user.role,
      tv: user.tokenVersion || 0
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN, jwtid: jti }
  );

  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + durationToMs(REFRESH_TOKEN_EXPIRES_IN || '30d'));

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt
  });

  return { token, tokenHash, expiresAt };
};

const issueAuthTokens = async (user) => {
  const accessToken = issueAccessToken(user);
  const refreshToken = await issueRefreshToken(user);

  return {
    accessToken,
    refreshToken: refreshToken.token
  };
};

const findRefreshTokenRecord = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  return RefreshToken.findOne({ tokenHash });
};

const revokeRefreshToken = async (refreshToken, { replacedByTokenHash = '' } = {}) => {
  const record = await findRefreshTokenRecord(refreshToken);

  if (!record || record.revokedAt) {
    return null;
  }

  record.revokedAt = new Date();
  if (replacedByTokenHash) {
    record.replacedByTokenHash = replacedByTokenHash;
  }

  await record.save();
  return record;
};

const revokeAllRefreshTokensForUser = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

const purgeExpiredRefreshTokens = async () => {
  await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
};

const verifyRefreshToken = (refreshToken) => jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

module.exports = {
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  issueAuthTokens,
  findRefreshTokenRecord,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  purgeExpiredRefreshTokens,
  verifyRefreshToken
};