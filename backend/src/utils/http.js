const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const assertFound = (entity, message = 'Resource not found') => {
  if (!entity) {
    throw createHttpError(404, message);
  }
  return entity;
};

module.exports = {
  createHttpError,
  assertFound,
};
