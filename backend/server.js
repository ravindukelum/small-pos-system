const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./database/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
const database = new Database();
database.initialize().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'POS System API Server is running!' });
});

// Import route modules
const partnerRoutes = require('./routes/partners');
const investmentRoutes = require('./routes/investments');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/api/partners', partnerRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;