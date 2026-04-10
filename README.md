# AI-Powered Personal Finance Tracker

A full-stack expense tracker with AI chatbot capabilities.

## Tech Stack

- **Frontend**: Next.js (React) + CSS Modules
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **AI**: Claude API (Anthropic)

## Project Structure

```
EXPENSE-TRACKER/
├── client/          # Next.js Frontend
│   ├── src/
│   │   ├── app/     # Pages (Dashboard, Expenses, Summary, Chat)
│   │   ├── components/  # Reusable UI components
│   │   └── lib/     # API utilities, categories
│   └── package.json
│
├── server/          # Express Backend
│   ├── config/      # MongoDB connection
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API endpoints
│   └── index.js     # Express entry point
│
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** (`server/.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Client** (`client/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB Atlas cluster.

### 4. Run the Application

**Terminal 1 — Backend**:
```bash
cd server
npm start
```
Server runs on `http://localhost:5000`

**Terminal 2 — Frontend**:
```bash
cd client
npm run dev
```
Client runs on `http://localhost:3000`

## Features

- **Dashboard**: Monthly spending overview + quick expense entry
- **Expenses**: View all expenses grouped by date with filters
- **Summary**: Category-wise spending breakdown with visual bars
- **AI Chat**: Ask about your expenses in natural language (e.g., "How much did I spend on food this month?")
