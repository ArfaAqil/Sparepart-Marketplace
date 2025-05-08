require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const partRoutes = require('./routes/partRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());
