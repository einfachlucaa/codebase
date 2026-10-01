// Wrapper, damit Fehler aus async Controller-Funktionen automatisch
// beim zentralen errorHandler landen, statt den Server abstürzen zu lassen.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
