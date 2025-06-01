# 📋 Planner App

A modern, full-stack task and project management application built with Node.js and React. Organize your projects, manage tasks with subtasks, track progress, and boost your productivity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)
![React](https://img.shields.io/badge/react-v19-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5+-blue.svg)

## ✨ Features

🔐 **Authentication & Security**

- JWT-based authentication with secure cookies
- Password hashing with bcrypt
- Rate limiting and CORS protection

📋 **Task Management**

- Create, edit, and organize tasks with subtasks
- Set priorities, due dates, and time tracking
- Mark tasks as complete with progress tracking
- Bulk operations for efficiency

🏗️ **Project Organization**

- Hierarchical project structure
- Project statistics and progress visualization
- Archive projects to keep workspace clean
- Custom project icons and colors

🏷️ **Tagging System**

- Organize tasks with colored tags
- Filter and search by tags
- Tag management and customization

📎 **File Attachments**

- Upload files to tasks
- File metadata and organization
- Secure file storage

🔍 **Search & Filtering**

- Advanced search across tasks and projects
- Multiple filter options (status, tags, dates)
- Real-time search results

📊 **Analytics & Insights**

- User productivity statistics
- Project progress tracking
- Task completion analytics

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/noolangelo/planner-app.git
   cd planner-app
   ```

2. **Install dependencies**

   ```bash
   # Backend dependencies
   npm install

   # Frontend dependencies
   cd planner-frontend && npm install && cd ..
   ```

3. **Database setup**

   ```bash
   # Create database
   createdb planner_app_dev

   # Create environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start development servers**

   ```bash
   # Terminal 1 - Start Database
   sudo launchctl start postgresql-17  # macOS
   # Or: sudo systemctl start postgresql  # Linux

   # Terminal 2 - Start Backend (http://localhost:3001)
   npm run dev

   # Terminal 3 - Start Frontend (http://localhost:5173)
   cd planner-frontend && npm run dev
   ```

5. **Access the application**
   - Open your browser to `http://localhost:5173`
   - Create an account and start organizing your tasks!

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js framework
- **PostgreSQL** database with Sequelize ORM
- **JWT** authentication with bcrypt hashing
- **Multer** for file uploads
- **Rate limiting** and security middleware

### Frontend

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query** for state management
- **React Router v7** for navigation
- **Axios** for API communication

## 📁 Project Structure

```
planner-app/
├── 🖥️ Backend (Express.js)
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── routes/            # API route handlers
│   │   ├── models/            # Database models (Sequelize)
│   │   ├── middleware/        # Express middleware
│   │   └── config/            # Configuration files
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
│
├── 🌐 Frontend (React + TypeScript)
│   └── planner-frontend/
│       ├── src/
│       │   ├── components/    # Reusable React components
│       │   ├── pages/         # Page components
│       │   ├── contexts/      # React contexts (Auth, etc.)
│       │   ├── hooks/         # Custom React hooks
│       │   ├── services/      # API service functions
│       │   └── types/         # TypeScript type definitions
│       ├── public/            # Static assets
│       └── package.json       # Frontend dependencies
│
└── 📋 Documentation
    ├── README.md              # This file
    └── .gitignore             # Git ignore rules
```

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planner_app_dev
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRE=7

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Security Configuration
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API Documentation

### Authentication Endpoints

```
POST /api/auth/register    # Create new account
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get user profile
PUT  /api/auth/me          # Update user profile
```

### Task Management

```
GET    /api/tasks          # List tasks (with filters & pagination)
POST   /api/tasks          # Create new task
GET    /api/tasks/:id      # Get task details
PUT    /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
PATCH  /api/tasks/:id/complete  # Toggle task completion
PATCH  /api/tasks/bulk     # Bulk update tasks
```

### Project Management

```
GET    /api/projects       # List projects
POST   /api/projects       # Create project
GET    /api/projects/:id   # Get project details
PUT    /api/projects/:id   # Update project
DELETE /api/projects/:id   # Delete project
GET    /api/projects/tree  # Get project hierarchy
```

### Tags & Attachments

```
GET    /api/tags           # List all tags
POST   /api/tags           # Create tag
PUT    /api/tags/:id       # Update tag
DELETE /api/tags/:id       # Delete tag
POST   /api/attachments    # Upload file
DELETE /api/attachments/:id # Delete attachment
```

## 🚦 Development

### Available Scripts

**Backend:**

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (development only)
```

**Frontend:**

```bash
cd planner-frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database Management

**Start PostgreSQL:**

```bash
# macOS (Homebrew)
sudo launchctl start postgresql-17

# Linux (systemd)
sudo systemctl start postgresql

# Check if running
ps aux | grep postgres | grep -v grep
```

**Stop PostgreSQL (to save resources):**

```bash
# macOS
sudo launchctl stop postgresql-17

# Linux
sudo systemctl stop postgresql
```

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database `planner_app_dev` exists

**Port conflicts:**

```bash
# Check what's running on ports
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port
```

**Frontend build issues:**

```bash
cd planner-frontend
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**

- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Restart backend server after changing `.env`

## 🚀 Deployment

### Production Checklist

1. **Environment Setup:**

   - Set `NODE_ENV=production`
   - Use secure, random `JWT_SECRET` (32+ characters)
   - Configure production database credentials
   - Update `FRONTEND_URL` to production domain

2. **Security:**

   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting
   - Use environment variables for all secrets

3. **Database:**

   - Run migrations: `npm run db:migrate`
   - Backup strategy for production data

4. **Frontend Build:**

   ```bash
   cd planner-frontend
   npm run build
   # Serve dist/ folder with nginx or similar
   ```

5. **Process Management:**
   - Use PM2, systemd, or Docker for process management
   - Set up logging and monitoring
   - Configure automatic restarts

### Example PM2 Configuration

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name "planner-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes and test thoroughly**
4. **Commit your changes:** `git commit -m 'Add amazing feature'`
5. **Push to the branch:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React and Node.js best practices
- UI components inspired by modern productivity tools
- Database design following normalization principles
- Security practices following OWASP guidelines

## 📞 Support

- 🐛 **Bug Reports:** [Open an issue](https://github.com/noolangelo/planner-app/issues)
- 💡 **Feature Requests:** [Open an issue](https://github.com/noolangelo/planner-app/issues)

---

**Made with ❤️ for productivity enthusiasts**

⭐ Star this repo if you find it helpful!
