# DSA Project Planner & CPM Scheduler (Full-Stack)

A production-grade, full-stack Data Structures & Algorithms (DSA) project planning application with **completely separated Frontend and Backend** architectures. It models tasks as a Directed Acyclic Graph (DAG) and computes the **Critical Path Method (CPM)**, **Kahn's Topological Sort**, and **DFS Cycle Detection**, powered by a persistent **SQLite** database.

---

## 🏛️ Architecture Overview

The codebase is organized into clean, decoupled tiers:

```
DSA/
├── backend/                        # Node.js + Express REST API
│   ├── data/                       # Persistent SQLite database file
│   │   └── dsa_planner.sqlite
│   ├── src/
│   │   ├── algorithms/             # DSA Graph & Scheduling algorithms
│   │   │   ├── graph.js            # DirectedGraph (Adjacency List)
│   │   │   ├── cycleDetection.js   # 3-Color DFS Cycle Detection
│   │   │   ├── topologicalSort.js  # Kahn's BFS Algorithm
│   │   │   ├── criticalPath.js     # CPM (Early/Late Times, Float/Slack)
│   │   │   └── scheduler.js        # Schedule Coordinator & Timeline
│   │   ├── config/
│   │   │   └── db.js               # SQLite DatabaseSync connection & schema
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js             # Register, Login, Me
│   │   │   ├── projects.js         # Project CRUD & Template seeder
│   │   │   ├── tasks.js            # Task CRUD
│   │   │   ├── dependencies.js     # Dependency CRUD with Cycle Validation
│   │   │   └── dsa.js              # Dedicated Schedule & Graph API
│   │   └── server.js               # Express application entrypoint
│   ├── .env.example
│   ├── package.json
│   └── test_dsa.js                 # Backend DSA test suite
│
├── frontend/                       # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── api/                    # Centralized REST API client
│   │   │   ├── client.js           # Fetch wrapper with JWT injection
│   │   │   ├── auth.js             # Auth service
│   │   │   ├── projects.js         # Projects service
│   │   │   ├── tasks.js            # Tasks service
│   │   │   ├── dependencies.js     # Dependencies service
│   │   │   └── dsa.js              # Server DSA schedule consumer
│   │   ├── components/             # Reusable UI components & cards
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # User authentication state
│   │   ├── pages/                  # Dashboard, Timeline, Critical Path, etc.
│   │   └── ...
│   ├── vite.config.js              # Vite dev server with proxy to :5000
│   └── package.json
│
├── package.json                    # Workspace orchestration scripts
├── start-dev.js                    # Concurrent dev server runner
└── test_dsa.js                     # Root DSA test suite
```

---

## ⚡ Quick Start

### 1. Install Dependencies
Run the install command from the root directory to install both backend and frontend packages:
```bash
npm run install:all
```

### 2. Start Both Frontend and Backend Concurrently
From the root directory:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔧 Running Independently

### Running Backend Only
```bash
cd backend
npm run dev
```
*(Starts on `http://localhost:5000` with hot-reloading)*

### Running Frontend Only
```bash
cd frontend
npm run dev
```
*(Starts on `http://localhost:5173` with Vite dev proxy to backend)*

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create user account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve authenticated user profile

### Projects (`/api/projects`)
- `GET /api/projects` — List all projects for authenticated user
- `POST /api/projects` — Create a new project (`name`, `description`, `startDate`)
- `GET /api/projects/:id` — Get project details
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project (cascades to tasks & dependencies)
- `POST /api/projects/sample` — Seed a realistic project template (SDLC, FinTech, Cloud Migration, IoT Hub, AI Perception)

### Tasks (`/api/tasks`)
- `GET /api/tasks/project/:projectId` — List tasks for project
- `POST /api/tasks` — Create task (`projectId`, `name`, `duration`, `status`)
- `PUT /api/tasks/:id` — Update task details or status
- `DELETE /api/tasks/:id` — Delete task

### Dependencies (`/api/dependencies`)
- `GET /api/dependencies/project/:projectId` — Get project dependencies
- `POST /api/dependencies` — Add dependency (`predecessorId`, `successorId`)  
  *Note: Validates directed graph cycle detection. Rejects circular dependencies with HTTP 400 and the cycle loop path!*
- `DELETE /api/dependencies/:id` — Remove dependency

### DSA Calculations (`/api/dsa`)
- `GET /api/dsa/project/:projectId/schedule` — Computes full schedule, early/late dates, total float/slack, project duration, and critical path
- `GET /api/dsa/project/:projectId/graph` — Returns adjacency list, in-degree, out-degree, and vertex statistics
- `GET /api/dsa/project/:projectId/cycle-check` — Runs 3-color DFS cycle detector
- `GET /api/dsa/project/:projectId/critical-path` — Returns CPM analysis and slack mapping

---

## 🧪 DSA Algorithm Verification Suite

Run the comprehensive test suite verifying the algorithms:
```bash
npm run test:dsa
```

Verifies:
1. **DirectedGraph**: Adjacency list representation, in-degrees, and out-degrees.
2. **Cycle Detection**: 3-color DFS cycle detection with path extraction.
3. **Critical Path Method (CPM)**: Forward and backward pass, early/late times, slack.
4. **Academic Project Validation**: 18-day SDLC verification.
5. **High-Load Performance Benchmark**: 1,000+ tasks solved in <100ms.
