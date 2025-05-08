// This file includes several custom errors
// Refer to the example ../app/controllers to see how this
// custom work could be potentially utilized when making
// sequelize calls. Throwing a custom error gives you
// the ability to enhance feedback to the client.

exports.throwError = (code, errorMessage) => (err) => {
  // console.log(err);
  const error = new Error(errorMessage || 'Something has gone wrong');
  error.code = code;
  if (err.errors) {
    error.message = err.errors.map((e) => e.message).join('\n');
  }
  throw error;
};

exports.throwIf = (fn, code, errorMessage) => (result) => {
  if (fn(result)) {
    return exports.throwError(code, errorMessage)(new Error());
  }
  return result;
};
