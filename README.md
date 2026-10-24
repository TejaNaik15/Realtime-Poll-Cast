# 🗳️ LivePoll — Real-Time Voting App

A full-stack real-time polling application where users can create polls, vote on them, and watch results update **live** across all connected clients — powered by WebSockets.

---

## ✨ Features

- 🔴 **Live voting** — votes broadcast instantly to all connected users via Socket.io
- 📊 **Real-time results** — progress bars and vote counts update without any page refresh
- 🗳️ **Create polls** — add a question with 2–6 custom options
- 🃏 **Expandable poll cards** — click any poll to expand it and see full results with animated bars
- 🌀 **Animated hero** — squiggly text, word-reveal animations, Grandstander display font
- 📱 **Responsive** — works on mobile and desktop
- 🌑 **Dark theme** — pure black background with glassmorphism UI elements

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Socket.io Client | Real-time WebSocket connection |
| Motion (Framer) | Animations & expandable card transitions |
| CSS (vanilla) | Styling — no Tailwind, no UI library |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js | Runtime |
| Express 5 | REST API server |
| Socket.io | WebSocket server |
| MongoDB | Database |
| Mongoose | ODM / schema validation |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```
livepoll/
└── livevote/
    ├── client/                  # React frontend (Vite)
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── ui/
    │   │   │   │   └── squiggly-text.jsx   # Animated squiggly text
    │   │   │   ├── Navbar.jsx
    │   │   │   └── PollCard.jsx            # Expandable poll cards
    │   │   ├── hooks/
    │   │   │   └── use-outside-click.js
    │   │   ├── pages/
    │   │   │   ├── HomePage.jsx
    │   │   │   ├── CreatePage.jsx
    │   │   │   └── PollPage.jsx
    │   │   ├── styles/
    │   │   └── Socket.js                   # Socket.io client setup
    │   └── vite.config.js
    │
    └── server/                  # Node.js backend
        ├── models/
        │   └── Poll.js                     # Mongoose schema
        ├── routes/
        │   └── polls.js                    # REST API routes
        ├── db.js                           # MongoDB connection
        ├── server.js                       # Express + Socket.io server
        └── .env                            # Environment variables (git ignored)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/live-poll-vote.git
cd live-poll-vote/livevote
```

---

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Start the server:

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

---

### 3. Setup the Client

```bash
cd ../client
npm install
npm run dev
```

Client runs at `http://localhost:5173`

> The Vite dev server proxies `/api` and `/socket.io` requests to `http://localhost:5000` automatically.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/polls` | Get all polls (newest first) |
| `POST` | `/api/polls` | Create a new poll |
| `GET` | `/api/polls/:id` | Get a single poll by ID |
| `POST` | `/api/polls/:id/vote` | Submit a vote (REST fallback) |

### Poll Schema

```json
{
  "question": "What is your favourite season?",
  "options": [
    { "text": "Summer", "votes": 0 },
    { "text": "Winter", "votes": 0 }
  ],
  "totalVotes": 0,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## ⚡ WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `joinPoll` | Client → Server | `pollId` | Join a poll room |
| `submitVote` | Client → Server | `{ pollId, optionIndex }` | Submit a vote |
| `pollUpdated` | Server → Client | `poll` (full object) | Broadcast updated poll to room |

---

## 🖥️ Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section + browse polls |
| `/create` | Create | Form to create a new poll |
| `/poll/:id` | Poll | Live voting page with real-time results |

---

## 🎨 UI Highlights

- **Grandstander 900** display font for all hero text
- **Squiggly text animation** on the eyebrow using SVG `feTurbulence` displacement filters
- **Expandable poll cards** — list rows that animate into full modals using `motion` shared layout animations
- **Word-reveal animations** on hero text with staggered delays
- **How it Works** strip with hover effects
- **Glassmorphism** nav pill with backdrop blur

---

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `PORT` | ❌ | Server port (defaults to `5000`) |
| `NODE_ENV` | ❌ | Set to `production` to serve React build |

---

## 📦 Build for Production

```bash
# Build the React client
cd client
npm run build

# Start the server (serves the built client)
cd ../server
NODE_ENV=production npm start
```

The server will serve the React build from `client/build` and handle all API + WebSocket traffic on a single port.

---

## 📄 License

MIT — free to use, modify and distribute.

---

> Built with ❤️ using React, Node.js, Socket.io and MongoDB
