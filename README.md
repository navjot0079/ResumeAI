<div align="center">

# 🤖 ResumeAI — AI Resume Analyzer

**Land more interviews. Let AI optimize your resume.**

Upload a PDF → Paste a job description → Get an instant ATS score & actionable feedback.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **ATS Score** | Get a 0–100 compatibility score showing how well your resume matches the job |
| 🎯 **Skill Gap Analysis** | See which required skills you have and which are missing |
| 🔑 **Missing Keywords** | Spot important keywords from the job listing absent in your resume |
| 💪 **Strengths & Weaknesses** | AI-generated breakdown of what works and what doesn't |
| 💡 **Smart Suggestions** | Tailored recommendations to boost your resume for each role |
| 📁 **Analysis History** | Save, review, and compare past analyses on your dashboard |
| 🔐 **Secure Auth** | JWT authentication with access & refresh token rotation |
| 📄 **PDF Upload** | Drag-and-drop resume parsing with instant text extraction |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React · Vite · Tailwind CSS |
| **Backend** | Python · FastAPI · Pydantic · Uvicorn |
| **Database** | MongoDB (Motor async driver) |
| **AI Engine** | Google Gemini API |
| **Auth** | JWT (Access + Refresh tokens) |
| **PDF Parsing** | PyPDF |

---

## 🗂️ Project Structure

```
ResumeAI/
├── 📂 backend/
│   ├── 📂 app/
│   │   ├── ⚙️ config.py         # Environment & settings
│   │   ├── 🗄️ database.py       # MongoDB connection
│   │   ├── 🚀 main.py           # FastAPI entry point
│   │   ├── 📂 middleware/        # Auth middleware
│   │   ├── 📂 models/           # Pydantic schemas
│   │   ├── 📂 routes/           # API route handlers
│   │   └── 📂 services/         # Business logic & AI
│   ├── 📋 requirements.txt
│   └── 🔒 .env
├── 📂 frontend/
│   ├── 📂 src/                  # React components & pages
│   ├── 📄 index.html
│   ├── ⚙️ vite.config.js
│   └── 📋 package.json
└── 📖 README.md
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- 🐍 Python 3.10+
- 📦 Node.js 18+
- 🍃 MongoDB (local or Atlas)
- 🔑 Gemini API Key → [Get one here](https://aistudio.google.com/app/apikey)

### 1️⃣ Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Update .env with your credentials
# - Set GEMINI_API_KEY to your actual Gemini API key
# - Update MONGODB_URL if using Atlas

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 3️⃣ Access the App

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| ⚡ Backend API | http://localhost:8000 |
| 📚 API Docs | http://localhost:8000/docs |

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB connection string |
| `DATABASE_NAME` | Database name |
| `JWT_SECRET_KEY` | Secret for access tokens |
| `JWT_REFRESH_SECRET_KEY` | Secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `UPLOAD_DIR` | Directory for uploaded files |

---

<div align="center">

**⭐ Star this repo if you found it useful!**

Made with ❤️ using FastAPI & React

</div>
