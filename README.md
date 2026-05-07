# 🚀 ProjectFlow — Full Stack SaaS Project Management

A production-ready collaborative project management platform built with Next.js, Express.js, and MongoDB.

## ✨ Features

- 🔐 JWT Authentication with refresh token rotation
- 👥 Role-based access control (Admin / Member)
- 📋 Kanban board with drag-and-drop
- 📊 Analytics dashboard with charts
- 🔔 In-app notifications
- 📁 File attachments
- 💬 Task comments with real-time feel
- 📈 Activity timeline per project
- 🌙 Dark mode first design
- 📱 Fully responsive

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| UI | Radix UI primitives, Framer Motion |
| State | Redux Toolkit + React Query |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |
| Drag-Drop | @hello-pangea/dnd |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
```

Backend runs at: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Frontend runs at: http://localhost:3000

## 📁 Project Structure

```
Ethara/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # Express routers
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, RBAC, error, upload
│   │   ├── validators/   # Zod schemas
│   │   └── utils/        # JWT, helpers, response
│   ├── app.js            # Express app setup
│   └── server.js         # Entry point
│
└── frontend/
    └── src/
        ├── app/          # Next.js App Router pages
        ├── components/   # Reusable UI components
        ├── services/     # API service layer
        ├── store/        # Redux store + slices
        ├── hooks/        # Custom React hooks
        ├── lib/          # Utilities, API client
        └── types/        # TypeScript interfaces
```

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/forgot-password | Send reset link |
| POST | /api/auth/reset-password/:token | Reset password |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/me | Update profile |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/comments | Add comment |
| PUT | /api/tasks/reorder | Reorder tasks |
| POST | /api/tasks/:id/attachments | Upload file |

### Team
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/team/invite | Invite member |
| PUT | /api/team/role | Change role |
| DELETE | /api/team/:projectId/:memberId | Remove member |
| GET | /api/team/:projectId/members | List members |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard/stats | Analytics data |

## 🔒 Security

- JWT with 15-minute access tokens + 7-day refresh tokens
- Bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS whitelist
- Rate limiting (200 req/15min global, 20 req/15min auth)
- Zod input validation
- Soft delete for tasks

## ☁️ Deployment

### Backend → Railway

1. Create Railway project
2. Add MongoDB plugin
3. Set environment variables
4. Deploy from GitHub

### Frontend → Vercel

1. Import repo to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
3. Deploy

## 📝 Environment Variables

### Backend `.env`
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.vercel.app
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```
