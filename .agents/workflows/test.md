---
description: How to test the functionality of both the backend and frontend.
---

### 1. Backend Testing (Django/Pytest)
The backend uses `pytest` for automated testing.

// turbo
1. Run all backend tests:
   ```bash
   cd backend && ./venv/bin/pytest
   ```

2. Run tests with coverage:
   ```bash
   cd backend && ./venv/bin/pytest --cov=.
   ```

### 2. Frontend Testing (React/Vite)
Currently, frontend tests are not yet set up. It is recommended to use **Vitest** for unit tests.

1. Install Vitest and React Testing Library (optional):
   ```bash
   cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. Add a `test` script in `frontend/package.json`:
   ```json
   "scripts": {
     "test": "vitest"
   }
   ```

3. Run manual functional tests:
   *   Start the backend: `cd backend && ./venv/bin/python manage.py runserver`
   *   Start the frontend: `cd frontend && npm run dev`
   *   Open your browser at `http://localhost:5173` and verify the UI.

### 3. End-to-End (E2E) Testing
For critical flows like logging in and creating leads:
*   Consider installing **Cypress** or **Playwright**.
