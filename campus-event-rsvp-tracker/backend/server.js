require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet= require("helmet");

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/eventDB")
.then(()=> console.log("Database connected"))
.catch(err => console.log(err));

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100
});

app.use(limiter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Server is working");
});
