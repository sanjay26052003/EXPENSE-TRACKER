const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: 'Invalid category',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { Expense, EXPENSE_CATEGORIES };
