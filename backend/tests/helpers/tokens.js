const jwt = require("jsonwebtoken");

function makeToken(userId, role = "user") {
  return jwt.sign(
    { sub: userId.toString(), role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

function makeAdminToken(userId) {
  return makeToken(userId, "admin");
}

module.exports = { makeToken, makeAdminToken };