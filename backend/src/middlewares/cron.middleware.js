const authorizeCronRequest = (req, res, next) => {
  const cronSecret = String(process.env.CRON_SECRET || '').trim();
  const providedSecret = String(req.get('x-cron-secret') || '').trim();
  const secretMatches = Boolean(cronSecret && providedSecret && providedSecret === cronSecret);

  if (secretMatches) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden' });
};

module.exports = { authorizeCronRequest };