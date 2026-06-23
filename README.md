# codeVector-analytics

High-performance product analytics dashboard with cursor-based pagination over 200,000+ records.

## Tech Stack
- **Backend:** Node.js, Express, PostgreSQL (Neon), cursor-based B-Tree pagination
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui

## Setup

### Backend
```bash
cd backend
npm install
node seed.js    # Seed 200k products
node server.js  # Starts on port 3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Starts on port 5173
```
