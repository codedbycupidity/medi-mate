# MediMate

A comprehensive medication reminder application with web and mobile interfaces, helping users manage their medication schedules effectively.

## 🏗️ Architecture

MediMate is built as a fullstack application with:

- **Backend API**: Node.js + Express + TypeScript + MongoDB
- **Web Frontend**: React + TypeScript + Tailwind CSS
- **Mobile App**: React Native + TypeScript
- **Shared Package**: Common types and utilities
- **Infrastructure**: Docker Compose + Nginx

### Project Structure

```
medi-mate/
├── backend/          # Express API server
├── frontend/         # React web application
├── mobile/           # React Native mobile app
├── shared/           # Shared types and utilities
├── nginx/            # Nginx reverse proxy config
├── docker-compose.yml
├── Makefile          # Development commands
└── commands.txt      # Command reference
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Make (usually pre-installed on macOS/Linux)
- For mobile development:
  - iOS: macOS with Xcode
  - Android: Android Studio

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medi-mate.git
cd medi-mate
```

2. Run the setup:
```bash
make setup
```

3. Start the development environment:
```bash
make dev
```

The application will be available at:
- Web Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Mobile Metro: http://localhost:8081

## 📝 Available Commands

Run `make help` to see all available commands:

### Setup & Installation
- `make setup` - Complete project setup
- `make install` - Install all dependencies
- `make install-[backend|frontend|mobile|shared]` - Install specific dependencies

### Development
- `make dev` - Start all services with Docker
- `make dev-backend` - Start backend server only
- `make dev-frontend` - Start frontend server only
- `make dev-mobile` - Start React Native metro bundler

### Building
- `make build` - Build all projects
- `make build-[shared|backend|frontend|mobile]` - Build specific project

### Testing & Quality
- `make test` - Run all tests
- `make test-[backend|frontend|mobile]` - Run specific tests
- `make lint` - Run linters
- `make typecheck` - TypeScript type checking

### Docker
- `make docker-up` - Start Docker containers
- `make docker-down` - Stop Docker containers
- `make docker-restart` - Restart containers
- `make docker-logs` - View container logs

### Mobile Development
- `make ios` - Run iOS app
- `make android` - Run Android app

### Maintenance
- `make clean` - Clean build artifacts and node_modules

## 🔧 Development Workflow

### Adding Dependencies

```bash
# Backend
cd backend && npm install package-name

# Frontend
cd frontend && npm install package-name

# Mobile
cd mobile && npm install package-name

# Shared (remember to rebuild after adding)
cd shared && npm install package-name
make build-shared
```

### Working with Shared Types

The `shared` package contains common TypeScript types and utilities used across all platforms:

```typescript
import { User, Medication, MedicationFrequency } from '@medimate/shared';
```

After modifying shared types, rebuild:
```bash
make build-shared
```

### Database Access

Connect to MongoDB:
```bash
docker-compose exec database mongosh -u admin -p adminpass medimate
```

### API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/medications
```

## 🏛️ API Structure

The backend API follows RESTful conventions:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/medications/*` - Medication CRUD
- `/api/reminders/*` - Reminder management

## 🎨 Frontend Features

### Web Application
- Responsive design with Tailwind CSS
- React Router for navigation
- Axios for API communication
- React Hook Form for form handling
- Date-fns for date manipulation

### Mobile Application
- React Navigation for routing
- Native UI components
- AsyncStorage for local data
- Push notifications support (planned)

## 🐳 Docker Services

- **database**: MongoDB 7.0
- **redis**: Redis cache
- **backend**: Node.js API server
- **frontend**: React development server
- **mobile**: React Native Metro bundler
- **nginx**: Reverse proxy

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

## 🚨 Troubleshooting

### Port Conflicts

If ports are already in use:
```bash
# Find and kill process using port 3000
kill -9 $(lsof -ti:3000)

# Or change ports in docker-compose.yml
```

### Docker Issues

```bash
# Reset everything
make docker-down
docker-compose down -v
make clean
make setup
```

### Mobile Development Issues

For React Native issues:
```bash
# iOS
cd mobile/ios && pod install

# Android
cd mobile/android && ./gradlew clean
```

## 📚 Additional Resources

- [Command Reference](./commands.txt) - Detailed command documentation
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [React Native Docs](https://reactnative.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `make test`
4. Run type checking: `make typecheck`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.