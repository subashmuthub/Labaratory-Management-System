# NEC LabMS - Laboratory Management System

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Sequelize (with MySQL/PostgreSQL)
- **Authentication:** Cookie-based, OTP, OAuth (Google)
- **Testing:** Jest, Supertest
- **Dev Tools:** ESLint, Prettier, Postman, VS Code

## Features
- User Registration (with OTP/email verification)
- Secure Login (OAuth & password)
- Role-based access control (Student, Faculty, Admin, etc.)
- Dashboard with statistics and recent activities
- Lab Management: Create, update, view labs
<!-- - Equipment Management: Add, update, view equipment -->
- Booking System: Reserve labs/equipment
- Incident Reporting & Notifications
- Calendar & Training Management
<!-- - Admin features: User stats, order stats (restricted) -->

## Manual & Workflow
1. **Setup:**
   - Install dependencies: `npm install` in both `frontend` and `zbackend`
   - Start backend: `npm start` in `zbackend`
   - Start frontend: `npm run dev` in `frontend`
2. **Register:**
   - New users register with email/OTP
   - Email verification required
3. **Login:**
   - Login with email/password or Google OAuth
   - Session managed via cookies
4. **Dashboard:**
   - View stats, activities, system status
   - Access features based on role
5. **Admin:**
   - Restricted endpoints for stats, user management

## Tools Used
- **Vite:** Fast frontend build tool
- **Sequelize:** ORM for database
- **Postman:** API testing
- **ESLint/Prettier:** Code quality
- **Jest/Supertest:** Testing
- **VS Code:** Development

## Project Structure
```
frontend/
  src/
    components/
    pages/
    services/
    ...
zbackend/
  routes/
  models/
  services/
  ...
```

---

For detailed setup, see comments in code and config files. For any issues, check logs or contact the maintainer.
