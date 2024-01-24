const express = require('express');
const app = express();
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');



const connectDB = require('./config/database');

// Configure env
dotenv.config();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Call connectDB function to establish the database connection
connectDB();


app.set('view engine', 'ejs');
app.set('views', ['./views/users', './views/admin']);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  // Set Cache-Control headers to prevent caching
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  // Continue to the next middleware
  next();
});

//User Route
const userRoute = require('./routes/authRoutes');
app.use('/', userRoute);

// Admin route
const adminRoute = require('./routes/adminRoutes');
app.use('/admin', adminRoute);



const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on ${process.env.DEV_MODE} mode and Port: ${PORT}`);
});


