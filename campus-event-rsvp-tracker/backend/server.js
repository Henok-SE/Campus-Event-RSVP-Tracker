require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet= require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const eventRoutes =require("./routes/eventRoutes");
const studentRoutes = require("./routes/studentRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100
});

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(limiter); 

mongoose.connect("mongodb://127.0.0.1:27017/eventDB")
.then(()=> console.log("Database connected"))
.catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/students", studentRoutes); 
app.get("/", (req, res) => {
  res.send("Server is working");
});
app.use("/api/protected", authMiddleware);
app.use((req, res) => {
  console.log("❌ Route not found:", req.method, req.url);
  res.status(404).send("Route not found");
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


