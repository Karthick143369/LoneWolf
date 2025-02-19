
exports.globalErrorHandler = (err, req, res, next) => {
  //stack
  //message
  //statusCode
  let StatusCode = err?.StatusCode ? err?.StatusCode : 500;
  let stack = err?.stack;
  let message = err?.message;
  res.status(StatusCode).json({
    stack,
    message
  });
};



exports.notFound = (req, res, next) => {
  const err = new Error(`Route${req.originalUrl} not found`);
  next(err);
}
