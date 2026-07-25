# AI Powered Learning Platform

An AI Powered Learning platform where user uploads files of the topics he/she wants to learn or explore so that an topic based AI video generates and also an Assessment and also evaluated by the LLM Model and flagging of merits and demerits.

## 🚀 Features

### Core Features
- **AI Video Generation**: Automatically generates topic-based AI videos from uploaded PDF content
- **Assessment Generation**: Creates comprehensive assessments based on learning materials
- **LLM Evaluation**: Evaluates assessments using advanced LLM models
- **Merit & Demerit Flagging**: Identifies and flags strengths and areas for improvement
- **Content Ingestion Pipeline**: Automated PDF processing and knowledge extraction
- **Multi-Format Support**: Supports various file types for learning content upload

### Advanced Features
- **Adaptive Difficulty Engine**: Real-time difficulty adjustment based on student performance
- **Level-Based Progression**: 4-level difficulty system (Easy → Medium → Hard → Expert)
- **Performance Analytics**: Detailed tracking of student progress and learning patterns
- **Weak Topic Identification**: Automatic detection of areas needing improvement
- **Real-Time Feedback**: Immediate explanations and motivational messages

## 🏗️ Architecture

### Backend (Python/FastAPI)
```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── models/        # Database models and schemas
│   ├── services/      # Business logic services
│   ├── database/      # Database configuration
│   └── utils/         # Utility functions
├── requirements.txt   # Python dependencies
└── .env.example      # Environment variables
```

### Frontend (Next.js/React)
```
frontend/
├── components/       # Reusable React components
├── pages/           # Next.js pages
├── styles/          # CSS and Tailwind configuration
├── public/          # Static assets
└── package.json     # Node.js dependencies
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Supabase**: Backend-as-a-Service for database and authentication
- **SQLite/PostgreSQL**: Database (SQLite for development, PostgreSQL for production)
- **PyMuPDF**: PDF processing and text extraction
- **Sentence Transformers**: Text embeddings and similarity
- **Groq API**: LLM integration for video generation and assessment evaluation

### Frontend
- **Next.js**: React framework with server-side rendering
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript
- **Framer Motion**: Animation library

### AI/ML
- **Video Generation**: AI-powered topic-based video generation
- **Assessment Evaluation**: LLM-based assessment evaluation and feedback
- **Merit & Demerit Analysis**: Automated identification of strengths and weaknesses
- **Adaptive Algorithms**: Custom difficulty adjustment logic
- **Text Embeddings**: Semantic similarity and duplicate detection
- **LLM Integration**: Groq API for intelligent content generation

## 📋 API Documentation

### Authentication
Currently using simple student ID-based authentication. JWT can be added for production.

### Core Endpoints

#### Content Ingestion
```http
POST /api/v1/ingest
Content-Type: multipart/form-data

file: PDF file
grade: 1 (optional)
subject: "Mathematics" (optional)
topic: "Geometry" (optional)
```

#### Quiz Generation
```http
POST /api/v1/quiz
Content-Type: application/json

{
  "subject": "Mathematics",
  "topic": "Geometry",
  "difficulty": "easy",
  "question_count": 5
}
```

#### Answer Submission
```http
POST /api/v1/submit-answer
Content-Type: application/json

{
  "student_id": "S001",
  "session_id": "QS001",
  "question_id": "Q001",
  "selected_answer": "3",
  "response_time": 4.5
}
```

#### Student Progress
```http
GET /api/v1/students/{student_id}/progress
```

#### Admin Dashboard
```http
GET /api/v1/admin/dashboard
```

### Response Formats

#### Quiz Response
```json
{
  "session_id": "QS_001",
  "questions": [
    {
      "id": "Q_001",
      "question": "How many sides does a triangle have?",
      "question_type": "mcq",
      "options": ["2", "3", "4", "5"],
      "difficulty": "easy"
    }
  ],
  "current_level": 1,
  "total_questions": 5
}
```

#### Answer Response
```json
{
  "is_correct": true,
  "correct_answer": "3",
  "explanation": "A triangle is defined as a polygon with three sides.",
  "motivational_message": "⚡ Great thinking!",
  "next_question": {...},
  "level_progression": "Level up! Now at Level 2"
}
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements-minimal.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run the application**
```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set environment variables**
```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Run the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Database Schema

### Core Tables
- **sources**: Uploaded PDF files and metadata
- **content_chunks**: Processed text segments
- **quiz_questions**: Generated quiz questions
- **students**: Student profiles and information
- **quiz_sessions**: Individual quiz attempts
- **student_answers**: Answer submissions and performance data

### Relationships
- Sources → ContentChunks (1:N)
- ContentChunks → QuizQuestions (1:N)
- Students → QuizSessions (1:N)
- QuizSessions → StudentAnswers (1:N)
- QuizQuestions → StudentAnswers (1:N)

## 🎯 Adaptive Difficulty System

### Level Progression
- **Level 1 (Easy)**: Basic concepts, single-step problems
- **Level 2 (Medium)**: Multi-step problems, basic application
- **Level 3 (Hard)**: Complex problems, critical thinking
- **Level 4 (Expert)**: Advanced concepts, synthesis

### Progression Rules
- **Level Up**: 4/5 correct answers in current level
- **Level Down**: First 2 questions incorrect
- **Question Selection**: 70% weak topics, 30% balanced practice

### Performance Metrics
- **Accuracy**: Correct answers / Total answers
- **Confidence Score**: Weighted accuracy with response time
- **Response Time**: Average time per question
- **Difficulty Progression**: Level advancement over time

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DATABASE_URL=sqlite:///./quizai.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Groq API (for video generation and assessment evaluation)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192

# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Redis Configuration (Optional - for caching)
REDIS_URL=redis://localhost:6379

# Security Configuration
SECRET_KEY=your_secret_key_here
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📈 Performance Optimization

### Caching Strategy
- **Redis**: Quiz results and session data
- **Database Indexing**: Optimized queries for performance
- **Lazy Loading**: Progressive content loading

### Scalability Considerations
- **Microservices**: Modular service architecture
- **Load Balancing**: Horizontal scaling capability
- **Database Sharding**: Multi-database support for large scale

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Deployment

#### Backend (Docker)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the /out directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Groq** for providing the LLM API
- **Sentence Transformers** for embedding models
- **FastAPI** for the excellent web framework
- **Next.js** for the React framework

## 📞 Support

For support and questions:
- Create an issue on GitHub
  
---

Built with ❤️ for the future of education
