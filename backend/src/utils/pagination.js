const toBoundedInteger = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

const resolvePagination = (query = {}, { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = toBoundedInteger(query.page, defaultPage, { min: 1 });
  const limit = toBoundedInteger(query.limit, defaultLimit, { min: 1, max: maxLimit });
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

module.exports = {
  toBoundedInteger,
  resolvePagination,
};
