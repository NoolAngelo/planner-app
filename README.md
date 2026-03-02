# Planner App

A modern, full-stack task and project management application built with Node.js and React. Organize your projects, manage tasks with subtasks, track progress, and boost your productivity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)
![React](https://img.shields.io/badge/react-v19-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5+-blue.svg)

## Features

**Authentication and Security**

- JWT-based authentication with secure cookies
- Password hashing with bcrypt
- Rate limiting and CORS protection

**Task Management**

- Create, edit, and organize tasks with subtasks
- Set priorities, due dates, and time tracking
- Mark tasks as complete with progress tracking
- Bulk operations for efficiency

**Project Organization**

- Hierarchical project structure
- Project statistics and progress visualization
- Archive projects to keep workspace clean
- Custom project icons and colors

**Tagging System**

- Organize tasks with colored tags
- Filter and search by tags
- Tag management and customization

**File Attachments**

- Upload files to tasks
- File metadata and organization
- Secure file storage

**Search and Filtering**

- Advanced search across tasks and projects
- Multiple filter options (status, tags, dates)
- Real-time search results

**Analytics and Insights**

- User productivity statistics
- Project progress tracking
- Task completion analytics

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Installation

1. Clone the repository
2. Install backend dependencies: `npm install`
3. Install frontend dependencies: `cd planner-frontend && npm install`
4. Create database: `createdb planner_app_dev`
5. Copy `.env.example` to `.env` and configure credentials
6. Start backend: `npm run dev`
7. Start frontend: `cd planner-frontend && npm run dev`
8. Open http://localhost:5173

## Tech Stack

### Backend

- **Node.js** with Express.js
- **PostgreSQL** with Sequelize ORM
- **JWT** authentication with bcrypt
- **Rate limiting** and security middleware

### Frontend

- **React 19** with TypeScript
- **Vite** build tool
- **Tailwind CSS** styling
- **TanStack Query** for data fetching
- **React Router v7** for navigation
- **Axios** for HTTP

## API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
PUT /api/auth/me
```

### Tasks

```
GET /api/tasks
POST /api/tasks
GET /api/tasks/:id
PUT /api/tasks/:id
DELETE /api/tasks/:id
PATCH /api/tasks/:id/complete
PATCH /api/tasks/bulk
```

### Projects

```
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
GET /api/projects/tree
```

### Tags and Attachments

```
GET /api/tags
POST /api/tags
PUT /api/tags/:id
DELETE /api/tags/:id
POST /api/attachments
DELETE /api/attachments/:id
```

## Troubleshooting

**Database connection errors:** Ensure PostgreSQL is running and credentials in `.env` are correct.

**Port conflicts:** Check with `lsof -i :3001` and `lsof -i :5173`.

## License

MIT License.

## Support

- **Bug Reports:** [Open an issue](https://github.com/noolangelo/planner-app/issues)
- **Feature Requests:** [Open an issue](https://github.com/noolangelo/planner-app/issues)

---

Built for productivity.
