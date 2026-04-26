# Litter Scouts API

Backend API server for Litter Scouts.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Reports

- `POST /api/reports/upload` - Upload a photo (requires auth)
- `POST /api/reports` - Create a new report (requires auth)
- `GET /api/reports` - Get all reports (with optional filters)
- `GET /api/reports/:id` - Get a single report
- `DELETE /api/reports/:id` - Delete a report (requires auth, owner only)

### Health Check

- `GET /health` - Server health status

## Environment Variables

See `.env.example` for required environment variables.

## Database

The API uses MySQL 8.0+ with Prisma ORM. Connection details are configured in the `.env` file.

## Authentication

Authentication is handled by Clerk. Protected endpoints require a Bearer token in the Authorization header.
