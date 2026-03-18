# MedEquip — Hospital Equipment Management System

Production-grade system for tracking medical equipment, maintenance, breakdowns, and reporting across hospital networks.

---

## Architecture

```
hospitalequip/
├── backend/          # NestJS REST API (port 3001)
│   └── src/
│       ├── auth/           # JWT auth, guards, strategies
│       ├── users/          # User management + RBAC
│       ├── equipment/      # Equipment CRUD + lifecycle
│       ├── locations/      # Province > District > Hospital > Department
│       ├── maintenance/    # Service records + spare parts
│       ├── breakdowns/     # Fault tracking + resolution
│       ├── comments/       # Comments and complaints
│       ├── reports/        # Report generation
│       └── common/         # Shared utilities
└── frontend/         # Next.js 14 App Router (port 3000)
    └── src/
        ├── app/            # Route pages
        ├── components/     # UI components
        ├── lib/            # API client + utilities
        ├── types/          # TypeScript definitions
        └── contexts/       # React contexts
```

---

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Backend    | NestJS 10, TypeORM, PostgreSQL        |
| Auth       | JWT (access + refresh tokens), bcrypt |
| Frontend   | Next.js 14 App Router, Tailwind CSS   |
| State      | TanStack Query v5                     |
| Forms      | React Hook Form + Zod                 |
| Charts     | Recharts                              |
| Containers | Docker + Docker Compose               |

---

## Setup — Option A: Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed.

```bash
# 1. Clone / navigate to project
cd hospitalequip

# 2. Copy and configure environment
cp .env.example .env
# Edit .env and change passwords/secrets!

# 3. Start all services
docker-compose up -d

# 4. Access
#   Frontend:  http://localhost:3000
#   Backend API: http://localhost:3001/api/v1
#   Swagger:   http://localhost:3001/docs
```

---

## Setup — Option B: Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### 1. Create Database

```sql
CREATE DATABASE hospital_equip;
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET

# Start in development mode (auto-creates tables, seeds admin)
npm run start:dev
```

Backend runs at `http://localhost:3001`
Swagger docs at `http://localhost:3001/docs`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Start
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Default Credentials

| Email                  | Password       | Role  |
|------------------------|----------------|-------|
| admin@hospital.com     | Admin@123456   | Admin |

> Change immediately in production!

---

## API Reference

All endpoints are prefixed `/api/v1`. JWT required (Bearer token) for all except login/register.

### Auth
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | /auth/login        | Login               |
| POST   | /auth/register     | Register            |
| GET    | /auth/profile      | Get own profile     |

### Equipment
| Method | Endpoint                    | Role          |
|--------|-----------------------------|---------------|
| GET    | /equipment                  | All           |
| GET    | /equipment/stats            | All           |
| GET    | /equipment/:id              | All           |
| GET    | /equipment/serial/:sn       | All           |
| POST   | /equipment                  | Admin/Tech    |
| PATCH  | /equipment/:id              | Admin/Tech    |
| PATCH  | /equipment/:id/status       | Admin/Tech    |
| DELETE | /equipment/:id              | Admin         |

### Locations
| Method | Endpoint                    | Role  |
|--------|-----------------------------|-------|
| GET    | /locations/tree             | All   |
| GET    | /locations/provinces        | All   |
| POST   | /locations/provinces        | Admin |
| GET    | /locations/districts        | All   |
| POST   | /locations/districts        | Admin |
| GET    | /locations/hospitals        | All   |
| POST   | /locations/hospitals        | Admin |
| GET    | /locations/departments      | All   |
| POST   | /locations/departments      | Admin |

### Maintenance
| Method | Endpoint                              | Role       |
|--------|---------------------------------------|------------|
| GET    | /maintenance                          | All        |
| GET    | /maintenance/stats                    | All        |
| GET    | /maintenance/:id                      | All        |
| GET    | /maintenance/equipment/:id/patterns   | All        |
| POST   | /maintenance                          | Admin/Tech |
| PATCH  | /maintenance/:id                      | Admin/Tech |
| DELETE | /maintenance/:id                      | Admin      |

### Breakdowns
| Method | Endpoint              | Role       |
|--------|-----------------------|------------|
| GET    | /breakdowns           | All        |
| GET    | /breakdowns/stats     | All        |
| GET    | /breakdowns/:id       | All        |
| POST   | /breakdowns           | Admin/Tech |
| PATCH  | /breakdowns/:id       | Admin/Tech |
| PATCH  | /breakdowns/:id/assign| Admin/Tech |
| DELETE | /breakdowns/:id       | Admin      |

### Reports
| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | /reports/dashboard        | Live dashboard summary             |
| GET    | /reports/equipment        | Equipment report (filterable)      |
| GET    | /reports/inventory        | Full inventory by location tree    |
| GET    | /reports/location         | Equipment by hospital & department |
| GET    | /reports/maintenance      | Maintenance history + costs        |
| GET    | /reports/breakdowns       | Breakdown analysis + downtime      |
| GET    | /reports/equipment/:id    | Per-equipment lifecycle report     |

### Users
| Method | Endpoint              | Role  |
|--------|-----------------------|-------|
| GET    | /users                | Admin |
| POST   | /users                | Admin |
| GET    | /users/:id            | All   |
| PATCH  | /users/:id            | All*  |
| DELETE | /users/:id            | Admin |

---

## Role Permissions

| Feature                   | Admin | Technician | Guest |
|---------------------------|-------|------------|-------|
| View equipment            | ✓     | ✓          | ✓     |
| Register/edit equipment   | ✓     | ✓          | ✗     |
| Delete equipment          | ✓     | ✗          | ✗     |
| Log maintenance           | ✓     | ✓          | ✗     |
| Report breakdowns         | ✓     | ✓          | ✗     |
| Add comments              | ✓     | ✓          | ✓     |
| Resolve comments          | ✓     | ✓          | ✗     |
| View reports              | ✓     | ✓          | ✓     |
| Manage users              | ✓     | ✗          | ✗     |
| Manage locations          | ✓     | ✗          | ✗     |

---

## Key Business Logic

- **Auto-next-service calculation** — When a maintenance record is completed, `nextServiceDate` is auto-calculated based on the equipment's `maintenanceFrequency`
- **Overdue detection** — A daily cron job (midnight) flags equipment where `nextServiceDate < today`
- **Status lifecycle** — Equipment status updates automatically when maintenance starts/completes or a breakdown is reported/resolved
- **Issue pattern tracking** — Maintenance records store issue tags; the `/maintenance/equipment/:id/patterns` endpoint aggregates the most common failures
- **Full lifecycle cost** — Equipment-specific reports include purchase cost + total maintenance cost + total repair cost

---

## Database Schema Overview

```
provinces ──< districts ──< hospitals ──< departments
                                              ↑
users ──────────────────────────────────── equipment
  ↑                                           ↑   ↑   ↑
maintenance_records ─────────────────────────┘   │   │
  └──< spare_parts                               │   │
breakdowns ──────────────────────────────────────┘   │
comments ────────────────────────────────────────────┘
```

---

## Production Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ random chars)
- [ ] Change default admin password immediately after first login
- [ ] Set `DB_SYNCHRONIZE=false` and use migrations in production
- [ ] Configure a reverse proxy (nginx) in front of both services
- [ ] Enable SSL/TLS
- [ ] Set up database backups
- [ ] Configure proper `CORS_ORIGINS` to only allow your domain
