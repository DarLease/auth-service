const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const formData = require("express-form-data");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
// Init Middleware
app.use(express.json());
app.use(cors());


// Connect Database
connectDB();
app.use(formData.parse());
// Define Routes
app.use("/api/register", require("./routes/api/register"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/user", require("./routes/api/user"));

// Connect Server
app.listen(PORT, () => {
  console.log(`Auth-Service at ${PORT}`);
});
