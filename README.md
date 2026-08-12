# Mini ERP + CRM

A simple ERP and CRM application built with Node.js, Express, React, and PostgreSQL.

## Tech Stack

- **Backend**: Node.js + TypeScript + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: React + TypeScript + Vite
- **Authentication**: JWT (to be implemented)

## Project Structure

```
mini-erp-crm/
├── backend/          # Express + TypeScript backend
│   ├── prisma/       # Prisma schema and migrations
│   ├── src/
│   │   ├── lib/      # Database connection
│   │   ├── middleware/ # Express middleware
│   │   ├── routes/   # API routes
│   │   └── index.ts  # Server entry point
│   └── .env.example  # Environment variables template
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── pages/    # React pages
│   │   ├── App.tsx   # Main app component with routing
│   │   └── main.tsx  # React entry point
│   └── .env.example  # Environment variables template
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (running locally)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/mini_erp_crm?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
```

5. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

6. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

## Frontend Routes

- `/` - Home page
- `/login` - Login page (authentication to be implemented)
- `/dashboard` - Dashboard (business modules to be implemented)

## Development Notes

- The project is set up with basic foundations only
- Business modules (customers, products, orders, etc.) are not yet implemented
- JWT authentication is configured but not yet implemented
- Prisma schema is ready for model definitions
- CORS is configured for frontend-backend communication
