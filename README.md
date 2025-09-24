

How to Run Locally: 

Backend:
```
cd backend
npm install
```

Create a .env in backend/ with:
```
PORT=5000
MONGO_URI=mongodb+srv://****************# or your Atlas URI
JWT_SECRET=supersecretchangeit
GOOGLE_CLIENT_ID=**********
JUDGE0_API_KEY=your_api_key_here
```

Start backend:
```
node server.js
```

Frontend:
```
cd frontend
npm install
```

Create a .env in frontend/ with:
```

VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=***********

```

Resume Analyzer Microservice:
```
cd ai_services4/resume-analyzer
uvicorn app:app --reload
```

Create a .env in ai_services4/resume-analyzer/ with:
```
GEMINI_API_KEY=******************
