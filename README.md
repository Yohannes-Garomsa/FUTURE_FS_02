# CRM — Client Lead Management System

A production-grade CRM backend built with **Django**, **Django REST Framework**, **PostgreSQL**, **Redis**, and **Celery**.

## Features

- 🔐 **JWT Authentication** with role-based access control (Admin / Manager / Agent)
- 📊 **Lead Management** — Full CRUD with soft delete, filtering, search, file attachments
- 🔄 **Sales Pipeline** — Kanban board, drag-and-drop stage transitions, audit logging
- 📞 **Activity Tracking** — Calls, meetings, notes, tasks linked to leads
- 🔔 **Notifications** — In-app + email notifications on lead assignment and status changes
- 📈 **Analytics** — Dashboard metrics, agent performance, lead trends, source conversion
- 🤖 **Background Tasks** — Celery + Redis for async email, notifications, daily digest
- 📂 **File Uploads** — Attach files to leads with size/type validation
- 📜 **API Documentation** — Auto-generated Swagger UI + ReDoc

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Django 4.2 | Web framework |
| DRF | REST API |
| PostgreSQL | Database |
| Redis | Caching + message broker |
| Celery | Background tasks |
| SimpleJWT | Authentication |
| drf-spectacular | API docs |

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your DB credentials
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## API Docs

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Architecture

```
backend/
├── crm_project/     # Settings, URLs, Celery config
├── common/          # Shared permissions, pagination, exceptions, utils
├── users/           # Auth + RBAC
├── leads/           # Lead CRUD + soft delete + attachments
├── activities/      # Activity tracking
├── pipelines/       # Sales pipeline + stages
├── notifications/   # Notifications + Celery tasks
## Testing

The project uses `pytest` for automated backend testing and includes a comprehensive test suite covering models, serializers, API endpoints, and RBAC permissions.

### Backend Tests
Run all tests:
```bash
cd backend
./venv/bin/pytest
```

Run with coverage report:
```bash
cd backend
./venv/bin/pytest --cov=.
```

### Frontend Tests
Currently, the frontend relies on manual verification. For automated UI tests, it is recommended to set up **Vitest** or **Cypress**.

### Troubleshooting Tests
If tests fail due to database access:
- Ensure you have a test database configured or are using SQLite for testing (check `crm_project/settings.py`).
- Run `pytest --create-db` if you've made significant schema changes without migrations.

```