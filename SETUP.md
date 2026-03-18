# CRM System Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (or use SQLite for development)
- Git

## Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create and activate virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database settings and secret key
   - For PostgreSQL, ensure your database is created

5. **Run migrations**

   ```bash
   python manage.py migrate
   ```

6. **Create superuser**

   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

## Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API URL**
   - Create `.env` file in frontend directory
   - Add: `REACT_APP_API_URL=http://localhost:8000/api`

4. **Start development server**
   ```bash
   npm run dev
   ```

## Database Setup (PostgreSQL)

1. **Install PostgreSQL**

   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create database and user**

   ```sql
   sudo -u postgres psql
   CREATE DATABASE crm_db;
   CREATE USER crm_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
   ```

3. **Update .env file**
   ```
   DB_NAME=crm_db
   DB_USER=crm_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

## Development

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/api/docs/

## Production Deployment

See DEPLOYMENT.md for production deployment instructions.
