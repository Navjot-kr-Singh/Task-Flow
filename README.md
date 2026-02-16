# 🚀 TASK-FLOW  
## Real-Time Task Collaboration Platform (Trello-Style)

A full-stack real-time task collaboration platform built using the MERN stack.  
Task-Flow enables multiple users to collaborate on boards, lists, and tasks with live synchronization.

---

# Problem Statement

Build a real-time task collaboration platform similar to a lightweight Trello/Notion hybrid where users can:

- Create Boards
- Create Lists inside Boards
- Create Tasks inside Lists
- Assign members to tasks
- Drag & Drop tasks across lists
- Mark tasks Done / Undone
- View real-time updates across multiple users

---

# Tech Stack

## Frontend
- React (Vite)
- Zustand (State Management)
- TailwindCSS
- Axios
- Socket.io-client
- dnd-kit (Drag & Drop)

## Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.io
- JWT Authentication
- bcrypt (Password hashing)
- express-validator
- Centralized error handling

---

# Architecture Overview

## Frontend Architecture

```
client/src/
 ├── api/
 │    └── axios.js
 ├── components/
 │    ├── ui/
 │    ├── Navbar.jsx
 │    ├── ListColumn.jsx
 │    └── TaskCard.jsx
 ├── layouts/
 │    ├── AuthLayout.jsx
 │    └── DashboardLayout.jsx
 ├── pages/
 │    ├── Login.jsx
 │    ├── Register.jsx
 │    ├── Dashboard.jsx
 │    └── BoardView.jsx
 ├── store/
 │    ├── authStore.js
 │    └── boardStore.js
 └── App.jsx
```

- SPA built with React.
- Zustand manages authentication and board state.
- Axios handles API abstraction.
- Socket provider handles real-time events.
- Optimistic UI updates implemented for smooth UX.

---

## Backend Architecture (MVC Pattern)

```
server/
 ├── config/
 │    └── db.js
 ├── controllers/
 │    ├── authController.js
 │    ├── boardController.js
 │    ├── listController.js
 │    └── taskController.js
 ├── middleware/
 │    ├── auth.js
 │    ├── asyncHandler.js
 │    └── error.js
 ├── models/
 │    ├── User.js
 │    ├── Board.js
 │    ├── List.js
 │    ├── Task.js
 │    └── Activity.js
 ├── routes/
 │    ├── auth.js
 │    ├── boards.js
 │    ├── lists.js
 │    └── tasks.js
 ├── socket/
 ├── utils/
 │    └── generateToken.js
 └── server.js
```

- Models → Database schema definitions
- Controllers → Business logic
- Routes → API endpoints
- Middleware → Authentication & error handling
- Socket layer → Real-time communication
- Utils → Helper functions

This clean separation ensures maintainability and scalability.

---

# Database Schema Design

## User
- name
- email (unique, indexed)
- password (hashed)
- role (admin | user)
- timestamps

## Board
- name
- owner (User reference)
- members (User[])
- timestamps

## List
- name
- board (Board reference)
- position
- timestamps

## Task
- title (indexed for search)
- description
- board (Board reference)
- list (List reference)
- assignedUsers (User[])
- position
- isCompleted (boolean)
- timestamps

## Activity
- user (User reference)
- board (Board reference)
- action
- task (optional)
- createdAt

### Relationships

User → Board → List → Task → Activity

Indexes:
- email (unique index)
- task.title (text index for search)

---

#  API Contract

## Authentication

```
POST   /api/auth/register
POST   /api/auth/login
```

## Boards

```
GET    /api/boards
POST   /api/boards
GET    /api/boards/:id
```

## Lists

```
POST   /api/lists
PATCH  /api/lists/:id
DELETE /api/lists/:id
```

## Tasks

```
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks?search=&page=&limit=
```

All protected routes require JWT authentication.

---

# Real-Time Synchronization Strategy

Real-time updates are implemented using Socket.io.

### Strategy

1. When a user opens a board, they join a board-specific socket room.
2. Server emits events:
   - taskCreated
   - taskUpdated
   - taskDeleted
   - taskMoved
   - taskStatusChanged
   - assignmentUpdated
3. Frontend listens and updates Zustand store.
4. Conflict resolution uses a Last-Write-Wins strategy.
5. Supports multi-tab real-time synchronization.

---

# Role-Based Access Control

## Admin
- Create boards
- Create lists
- Create tasks
- Assign users
- Move tasks
- Delete tasks
- Mark tasks done/undone

## User
- View assigned boards
- Mark tasks done/undone
- Cannot create or delete lists/tasks

Role middleware ensures route protection.

---

# Setup Instructions

## Clone Repository

```
git clone <your-repository-link>
cd TASK-FLOW
```

---

## Backend Setup

```
cd server
npm install
npm run dev
```

Create a `.env` file inside `server/`:

```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Backend runs on:
```
http://localhost:5001
```

---

## Frontend Setup

```
cd client
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

---

# Demo Credentials

Admin:
```
Email: admin@test.com
Password: 123456
```

User:
```
Email: user@test.com
Password: 123456
```

To seed sample data:

```
node seed.js
```

---

# Scalability Considerations

- JWT-based stateless authentication supports horizontal scaling.
- Socket.io can scale using Redis adapter.
- MongoDB indexing improves search performance.
- Board-based rooms reduce unnecessary socket broadcasts.
- Rate limiting implemented using express-rate-limit.
- Frontend and backend can be deployed independently.

---

# Security Practices

- Password hashing using bcrypt.
- JWT expiration enabled.
- Role-based authorization middleware.
- Input validation using express-validator.
- Centralized error handling.
- Rate limiting and secure headers.

---

# Assumptions & Trade-offs

- Conflict resolution uses Last-Write-Wins.
- Redis adapter not implemented but architecture supports scaling.
- Basic test coverage included.
- No offline mode implemented.

---

---

# Author

Navjot Kumar Singh  
Full Stack Developer | MERN Stack