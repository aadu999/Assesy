# Development Setup

## Running with Docker (Recommended)

This is the full production-like setup with all services:

```bash
docker-compose up --build
```

**Important:** You must also build the custom code-server image manually once:
```bash
docker build -t custom-code-server:latest ./code-server
```

Access points:
- Admin Panel: http://admin.interview.localhost
- API: http://api.interview.localhost
- Traefik Dashboard: http://localhost:8081

Login credentials:
- Username: `admin`
- Password: `password`

## Running Backend Locally (For Development)

If you want to run the backend locally for faster development:

1. Start the database and other services:
```bash
docker-compose up database traefik admin-frontend
```

2. Set environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env and set:
# DB_HOST=localhost
# DB_PORT=5433
```

3. Start the backend:
```bash
npm install
npm start
```

The backend will be available at http://localhost:3000

**Note:** When running locally, the admin frontend at http://admin.interview.localhost will NOT work because it expects the backend at http://api.interview.localhost. You'll need to either:
- Use the Docker setup, OR
- Modify the frontend to point to http://localhost:3000

## Git Workflow

All new features should be developed in feature branches:

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# When ready, merge to main
git checkout main
git merge feature/your-feature-name
git push origin main
```

Current feature branch: `feature/multi-tenant-ai`
