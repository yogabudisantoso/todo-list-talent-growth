const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/items', itemRoutes);
app.use('/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Todo List API' });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Resource not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});