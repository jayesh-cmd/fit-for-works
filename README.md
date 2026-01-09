# FitForWorks

**FitForWorks** is an AI-powered resume analyzer and job description matching platform. It helps candidates optimize their resumes to pass ATS (Application Tracking Systems) and land more interviews by providing granular, actionable feedback.

## 🚀 Features

- **AI Resume Review:** detailed scoring (0-100) based on ATS standards, impact, and formatting.
- **GitHub Portfolio Audit:** Automatically verifies and rates linked GitHub projects for quality (READMEs, code presence).
- **ResuMatcher:** Compares your resume against a specific Job Description (JD) to highlight missing keywords and skills.
- **Tailored Feedback:** Provides specific text replacements and improvement suggestions.

## 🛠️ Tech Stack

### Frontend
- **React (Vite)**
- **Tailwind CSS** (Styling & Animations)
- **Framer Motion** (UI Interactions)
- **Lucide React** (Icons)

### Backend
- **FastAPI (Python)**
- **Gemini 1.5 Flash** (Primary LLM)
- **Llama 3.3 (Groq)** (Fallback LLM)
- **LlamaParse** (PDF Extraction)
- **PyGithub** (GitHub API Integration)

## 📂 Project Structure

```
Solo Build/
├── api/                 # Backend API
│   ├── index.py         # API Entry point
│   ├── llm.py           # AI Analysis Logic (Gemini/Groq)
│   ├── github_get.py    # GitHub Audit Service
│   ├── parsing_service.py # Resume PDF Parser
│   └── requirements.txt # Backend Dependencies
└── frontend/
    ├── src/             # React Source Code
    └── package.json     # Frontend Dependencies
```

## ⚡ Setup & Installation

### 1. Backend Setup

Prerequisites: Python 3.9+

```bash
cd api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Server
python3 index.py
```
*Server runs on `http://localhost:8000`*

### 2. Frontend Setup

Prerequisites: Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Run Dev Server
npm run dev
```
*App runs on `http://localhost:5173`*

### 3. Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
GITHUB_TOKEN=your_github_token
LLAMA_CLOUD_API_KEY=your_llamaparse_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 📝 How It Works

1. **Upload:** User uploads a PDF resume.
2. **Parsing:** LlamaParse extracts text and GitHub links.
3. **Audit:** Backend verifies GitHub links and checks repo quality.
4. **Analysis:** LLM (Gemini) analyzes the resume + GitHub data against a "Technical Recruiter" persona.
5. **Result:** User sees a score, specific improvements, and rewrite suggestions.
