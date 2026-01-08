# OTEC Web Application

A modern full-stack web application built with React, NestJS, and PostgreSQL.

## 🎯 Development Approach

This project uses **UI-First Development** approach:
- ✅ Build UI components with mock data first
- ✅ Define API contracts upfront
- ✅ Implement backend later to match contracts
- ✅ Seamlessly switch between mock and real API

📖 **See [UI_FIRST_GUIDE.md](./UI_FIRST_GUIDE.md) for detailed instructions.**

📋 **See [API_CONTRACTS.md](./API_CONTRACTS.md) for API specifications.**

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Passport** - Authentication strategies
- **bcrypt** - Password hashing
- **class-validator** - DTO validation

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

## Installation

### 1. Clone the repository

```bash
cd /Users/sureshbala/Downloads/Otec
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=otec_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

### 3. Set up the Database

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE otec_db;

# Exit psql
\q
```

### 4. Set up the Frontend

```bash
cd ../frontend
npm install
```

## Running the Application

### Development Mode

#### Start the Backend

```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3000`

#### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3001`

### Production Mode

#### Build the Backend

```bash
cd backend
npm run build
npm run start:prod
```

#### Build the Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Project Structure

```
Otec/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users module
│   │   ├── config/         # Configuration files
│   │   ├── app.module.ts   # Root module
│   │   └── main.ts         # Application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Users (Protected)

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Features

- ✅ User authentication (JWT)
- ✅ User registration and login
- ✅ Protected routes
- ✅ User management
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Form validation
- ✅ Responsive design

## Environment Variables

### Backend (.env)

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS allowed origin

## Development

### Backend Commands

```bash
npm run start:dev    # Start development server
npm run build        # Build for production
npm run start:prod   # Start production server
npm run lint         # Run linter
npm run test         # Run tests
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Database Migrations

TypeORM will automatically synchronize the database schema in development mode. For production, use migrations:

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Security Notes

- Change `JWT_SECRET` in production
- Use strong database passwords
- Enable HTTPS in production
- Configure CORS properly
- Use environment variables for sensitive data

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists

### Port Already in Use

1. Change `PORT` in backend `.env`
2. Update `CORS_ORIGIN` accordingly
3. Update frontend proxy in `vite.config.ts`

### Module Not Found Errors

1. Run `npm install` in both backend and frontend
2. Clear `node_modules` and reinstall if needed

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

