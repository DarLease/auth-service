const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    return res
      .status(401)
      .json("Token was not found in header, authorization denied");
  }
  // Verify token
  try {
    jwt.verify(token, process.env.jwtSecret, (error, decoded) => {
      if (error) {
        return res.status(401).json(error);
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
