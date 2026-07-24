# 💰 Finance Tracker — Lending Business App

A professional full-stack finance tracker for small lending businesses.  
Manage customers, loans, interest calculations, payments, PDF bills, and monthly reports.

---

## 🛠 Tech Stack

| Layer      | Tech                             |
|------------|----------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS 3 |
| Backend    | Node.js + Express                |
| Database   | MongoDB (Mongoose)               |
| Auth       | JWT (Bearer token)               |
| PDF        | PDFKit (server-side)             |

---

## 📁 Project Structure

```
Finance/
├── backend/
│   ├── controllers/     # Business logic
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── server.js         # App entry point
│   ├── seed.js           # Creates default admin user
│   └── .env              # Environment variables
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── api/          # Axios instance
│       ├── components/   # Reusable UI components
│       ├── context/      # Auth + Theme providers
│       └── pages/        # Application pages
└── README.md
```

---

## 🚀 How to Run

### Prerequisites

- **Node.js** (v18+) — [Download](https://nodejs.org/)
- **MongoDB** — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://cloud.mongodb.com/)

### 1. Start MongoDB

Make sure MongoDB is running locally on `mongodb://localhost:27017`, or update `backend/.env` with your Atlas URI.

### 2. Start Backend

```bash
cd backend
npm install
npm run seed       # Creates default user: Ansh / Ansh_0207
npm run dev        # Starts on http://localhost:5000
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:3000
```

### 4. Open App

Go to **http://localhost:3000** and login with:
- **Username:** `Ansh`
- **Password:** `Ansh_0207`

---

## ✨ Features

- **Dashboard** — Total money given, interest earned, pending, customers
- **Customer Management** — Add, edit, delete with custom interest rates
- **Loan Management** — Simple & compound interest, per-loan rates
- **Auto Interest Calc** — Calculated on-the-fly based on elapsed time
- **Payment Tracking** — Record payments, view history, remaining balance
- **PDF Bills** — Download loan bills as professional PDFs
- **Monthly Report** — All customers with interest & payment summary
- **Backup/Restore** — Export/import data as JSON
- **Dark/Light Mode** — Toggle with system preference detection
- **Mobile Responsive** — Works great on phones and tablets

---

## 🔐 Default Login

| Username | Password  |
|----------|-----------|
| Ansh     | Ansh_0207 |

> ⚠️ Change the password after first login in production.

---

## 📊 Interest Formulas

**Simple Interest:**
```
Monthly = Principal × (Rate / 100)
Total   = Principal × Rate × Months / 100
```

**Compound Interest (Monthly):**
```
Total Interest = Principal × ((1 + Rate/100)^Months − 1)
```

---

## 💾 Backup

- **Export**: Dashboard → Backup → Export Data (downloads JSON)
- **Import**: Dashboard → Backup → Select File (replaces all data)

---

## 📝 Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_tracker
JWT_SECRET=your_secret_key_here
```
