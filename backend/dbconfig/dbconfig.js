const mongoose = require('mongoose');
require('dotenv').config();
// Connect to MongoDB with options
mongoose
  .connect('mongodb+srv://pawarhitesh321:Hitesh123@student.asaruev.mongodb.net/Growup')
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event
db.on('error', (err) => console.error('MongoDB connection error:', err));
