require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const expenseRoutes = require('./routes/expenseRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API is running' });
});

// 🔥 DEBUG (remove later)
console.log("MONGO_URI:", process.env.MONGO_URI);

// ✅ CONNECT TO MONGODB FIRST
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
  }
}

startServer();