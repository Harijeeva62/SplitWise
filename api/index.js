const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('../src/server/routes/auth');
const groupRoutes = require('../src/server/routes/groups');
const expenseRoutes = require('../src/server/routes/expenses');
const settlementRoutes = require('../src/server/routes/settlements');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/expenses', expenseRoutes);
app.use('/settle', settlementRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'SplitApp API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
