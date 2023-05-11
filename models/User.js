const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  phoneNumber: { type: Number },
  role: {
    type: String,
  },
  verified: {
    type: Boolean,
  },
});
module.exports = User = mongoose.model("user", UserSchema);
