# Cute Huang Messenger
**© Danial Mohmad — All Rights Reserved**

A full-stack realtime messaging platform. Private. Fast. Beautiful.
No phone number required — authenticate with a unique App ID.

---

## Project Structure

```
cute-huang-messenger/
├── frontend/          React + Vite + TypeScript
├── backend/           Node.js + Express + Socket.IO + TypeScript
└── README.md
```

---

## Prerequisites

| Tool          | Version   |
|---------------|-----------|
| Node.js       | ≥ 18.x    |
| npm           | ≥ 9.x     |
| PostgreSQL    | ≥ 14.x    |

---

## STEP 1 — Database Setup

Start PostgreSQL and create the database:

```sql
CREATE DATABASE cute_huang_messenger;
```

---

## STEP 2 — Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create your .env file from the example
cp .env.example .env

# 3. Edit .env with your values:
#    DATABASE_URL — your PostgreSQL connection string
#    JWT_ACCESS_SECRET — generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#    JWT_REFRESH_SECRET — same command, different value
#    CORS_ORIGIN — your frontend URL (default: http://localhost:5173)

# 4. Generate Prisma client
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Start development server
npm run dev
```

The backend will start at: **http://localhost:4000**

---

## STEP 3 — Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit if your backend runs on a different port/host

# 3. Start development server
npm run dev
```

The frontend will start at: **http://localhost:5173**

---

## Development (both servers at once)

Open two terminals:

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

---

## Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Output is in frontend/dist/
# Serve with nginx, Vercel, or any static host
```

---

## Deployment Notes

### Backend (e.g. Railway, Render, VPS)
1. Set all environment variables from `.env.example`
2. Run `npm run db:migrate` before starting
3. Run `npm start`

### Frontend (e.g. Vercel, Netlify)
1. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your backend URL
2. Build command: `npm run build`
3. Output dir: `dist`

---

## API Endpoints

| Method | Path                           | Auth | Description              |
|--------|--------------------------------|------|--------------------------|
| POST   | /api/auth/register             | No   | Create account           |
| POST   | /api/auth/login                | No   | Login                    |
| POST   | /api/auth/refresh              | No   | Refresh access token     |
| GET    | /api/auth/me                   | Yes  | Get current user         |
| GET    | /api/users/search?appId=HU-xxx | Yes  | Find user by App ID      |
| PATCH  | /api/users/me                  | Yes  | Update profile           |
| POST   | /api/users/me/avatar           | Yes  | Upload avatar            |
| GET    | /api/chats                     | Yes  | Get all chats            |
| POST   | /api/chats                     | Yes  | Create/get direct chat   |
| GET    | /api/chats/:chatId/messages    | Yes  | Get messages             |
| POST   | /api/chats/:chatId/messages    | Yes  | Send text message        |
| POST   | /api/chats/:chatId/media       | Yes  | Upload media message     |
| POST   | /api/chats/:chatId/seen        | Yes  | Mark messages as seen    |
| DELETE | /api/chats/messages/:id        | Yes  | Delete message           |
| GET    | /health                        | No   | Health check             |

---

## Socket.IO Events

| Event           | Direction       | Description                    |
|-----------------|-----------------|--------------------------------|
| `message:send`  | Client → Server | Send a message                 |
| `message:new`   | Server → Client | New message received           |
| `message:status`| Server → Client | Message status update          |
| `message:seen`  | Client → Server | Mark chat as seen              |
| `typing`        | Bidirectional   | Typing indicator               |
| `presence`      | Server → Client | User online/offline status     |

---

## Languages Supported

- 🇬🇧 English
- 🇨🇳 中文 (Chinese)
- 🇸🇦 العربية (Arabic) — RTL
- 🟢 سۆرانی (Kurdish Sorani) — RTL
- 🇧🇩 বাংলা (Bengali)

---

## License

**© 2025 Danial Mohmad. All Rights Reserved.**

Unauthorized copying, distribution, or modification of this software is strictly prohibited.
