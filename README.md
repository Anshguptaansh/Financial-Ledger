# 💰 Financial Ledger & Credit Risk Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://financial-ledger-zeta.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Backend-Node.js_%2B_Express-000000?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/ML_Service-FastAPI_%2B_Scikit_Learn-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, full-stack financial ledger and credit risk assessment platform built for lending businesses and financial managers. Seamlessly handles customer management, loan interest calculations, payment schedules, automated PDF billing, monthly accounting reports, and real-time Machine Learning credit default prediction.

---

## 🔗 Live Application

🌐 **Production Web App**: [https://financial-ledger-zeta.vercel.app](https://financial-ledger-zeta.vercel.app)

---

## 🌟 Key Features

- 📊 **Real-time Financial Analytics Dashboard**
  - Instant overview of principal disbursed, total interest accrued, collected payments, and active customer balances.

- 👥 **Customer & Loan Management**
  - Maintain customer profiles, active loans, custom monthly/annual interest rates, and loan statuses.
  - Supports both **Simple Interest** and **Compound Interest** calculation models.

- 🤖 **Machine Learning Credit Risk Scoring**
  - Powered by a **FastAPI** microservice serving a trained **Random Forest** classification model.
  - Analyzes applicant age, checking/savings balances, credit amount, loan duration, and housing status to output real-time default probability, risk levels (*Low, Medium, High*), and model confidence metrics.

- 📄 **Automated PDF Billing & Exports**
  - Generates downloadable, formatted PDF account statements and bills on-the-fly using server-side rendering.
  - Complete JSON database backup export and import functionality.

- 🎨 **Modern & Adaptive UI**
  - Responsive dark/light theme support built with Tailwind CSS.
  - Fluid animations, interactive risk gauges, and mobile-first design.

---

## 🏗 Architecture Overview

```
Financial-Ledger/
├── api/                   # Vercel Serverless Functions
│   ├── auth/              # JWT Registration & Login Handlers
│   ├── customers/         # Customer Management CRUD Endpoints
│   ├── loans/             # Loan Processing & Interest Endpoints
│   ├── payments/          # Payment Logging & Calculation Endpoints
│   ├── reports/           # Analytics & Server-Side PDF Billing Handlers
│   └── credit-risk/       # Proxy to FastAPI ML Microservice
├── backend/               # Core Express backend logic & Mongoose schemas
│   ├── controllers/       # Controller logic
│   ├── models/            # Mongoose schemas (User, Customer, Loan, Payment)
│   └── seed.js            # Database seeding utility script
├── frontend/              # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── api/           # Axios HTTP client configuration
│   │   ├── components/    # Reusable UI components & modals
│   │   ├── context/       # Authentication & Theme state providers
│   │   └── pages/         # Application view components
├── ml/                    # Machine Learning Microservice
│   ├── app.py             # FastAPI REST endpoint server
│   ├── credit_risk_model.py # Model training & evaluation pipeline
│   └── requirements.txt   # Python ML dependencies
├── vercel.json            # Vercel Serverless & rewrite configuration
└── README.md
```

---

## 🛠 Tech Stack

| Component | Tech / Library |
|---|---|
| **Frontend Framework** | React 18, Vite, React Router DOM |
| **Styling & UI** | Tailwind CSS, PostCSS, Custom Design System |
| **Serverless API** | Express.js, Vercel Serverless Functions |
| **ML Microservice** | Python 3, FastAPI, Uvicorn, Scikit-Learn, Pandas, Joblib |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Authentication** | JSON Web Tokens (JWT) + Bcrypt password hashing |
| **Document Generation** | PDFKit |

---

## 🤖 Machine Learning Model Summary

The credit risk scoring engine uses data trained on historical credit applicant profiles:

- **Model Type**: Random Forest Classifier / Scikit-Learn Pipeline
- **Evaluation F1-Score**: `~0.785`
- **Key Features Analyzed**:
  - Applicant Age & Sex
  - Credit Loan Amount & Duration
  - Checking & Savings Account Tier
  - Housing Ownership Status & Job Category
- **Outputs**:
  - `risk_score` (Probability of default: `0.0` - `1.0`)
  - `risk_level` (`Low`, `Medium`, `High`)
  - `prediction` (`good` or `bad`)

---

## ⚙️ Local Development Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)

---

### 1. Repository Setup
```bash
git clone https://github.com/Anshguptaansh/Financial-Ledger.git
cd Financial-Ledger
```

### 2. Backend Environment Setup
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
```

### 3. Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev
```

### 4. ML Microservice Setup & Launch
```bash
cd ml
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## 📝 Environment Variables (Production / Vercel)

When deploying to Vercel, set the following environment variables in **Project Settings -> Environment Variables**:

| Variable Name | Description | Example / Note |
|---|---|---|
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | Random string (e.g. 32+ characters) |
| `CORS_ORIGIN` | Allowed origin for API requests | `https://financial-ledger-zeta.vercel.app` |
| `ML_SERVICE_URL` | URL of the hosted FastAPI service | `http://localhost:8000` or deployed ML service |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
