const jwt = require("jsonwebtoken");
const config = require("../../config/config");

function signToken(userId, tokenVersion) {
  return jwt.sign({ sub: userId, tv: tokenVersion || 0 }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signToken, verifyToken };
