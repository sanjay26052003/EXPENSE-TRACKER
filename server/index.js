require('dotenv').config();
const express = require('express');
const cors = require('cors');
const expenseRoutes = require('./routes/expenseRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
