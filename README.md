# NEC Laboratory Management System

A comprehensive web-based laboratory management system for managing equipment, bookings, maintenance, incidents, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MWT_PROJECT
```

2. **Backend Setup**
```bash
cd zbackend
npm install
# Configure .env file with your database credentials
npm start
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Quick Start (Both Servers)**
```bash
# From root directory (Windows)
start-servers.bat
```

## 📁 Project Structure

```
MWT_PROJECT/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Application pages
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom React hooks
│   │   └── config/       # Configuration files
│   └── package.json
│
├── zbackend/             # Node.js backend API
│   ├── config/          # Database & app configuration
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── migrations/      # Database migrations
│   ├── services/        # Business logic
│   ├── scripts/         # Utility scripts
│   └── server.js        # Main server file
│
└── docker/              # Docker configuration
```

## ✨ Features

### Equipment Management
- ✅ Add, edit, delete equipment
- ✅ Import equipment from Excel (allows duplicate entries)
- ✅ Bulk delete all equipment from a specific lab
- ✅ Filter by lab, category, status
- ✅ Track equipment specifications and condition
- ✅ Export to Excel

### Lab Management
- Manage multiple laboratories
- Assign equipment to labs
- Track lab capacity and utilization

### Booking System
- Book equipment and labs
- Calendar view
- Approval workflow
- Conflict detection

### Maintenance Tracking
- Schedule maintenance
- Track maintenance history
- Set priorities and technicians

### Incident Reporting
- Report equipment issues
- Track incident resolution
- Priority management

### User Management
- Role-based access control (Admin, Teacher, Lab Technician, Student)
- User authentication with JWT
- OAuth integration support

### Reports & Analytics
- Generate comprehensive Excel reports
- Equipment usage statistics
- Hierarchical filtering
- Custom date ranges

## 🔧 Configuration

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=labms
PORT=5000
JWT_SECRET=your_secret_key
```

### Frontend
- API calls are proxied through Vite dev server
- Configuration in `frontend/src/config/api.js`

## 📝 New Features (Latest Update)

### 1. Equipment Import - Allow Duplicates
- Removed duplicate serial number validation
- Users can now import the same equipment multiple times
- Useful for bulk equipment purchases

### 2. Bulk Delete by Lab
- Admin-only feature
- Delete all equipment from a specific lab with one click
- Warning confirmation before deletion
- Button appears when a lab is selected in filters

**Usage:**
1. Select a lab from the filter dropdown
2. Click "Delete All from Lab" button (red)
3. Confirm the action
4. All equipment from that lab will be deleted

## 🔒 Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes

## 🛠️ Scripts

### Backend Scripts
```bash
# Create admin user
node zbackend/scripts/create-admin.js

# Sync database
node zbackend/scripts/sync-db.js

# Create admin user (root level)
node zbackend/create-admin-user.js
```

## 📊 Database Schema

Main tables:
- Users
- Labs
- Equipment
- Bookings
- Maintenance
- Incidents
- Orders
- Training
- Notifications

## 🌐 API Endpoints

### Equipment
- `GET /api/equipment` - Get all equipment
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete single equipment
- `DELETE /api/equipment/lab/:labId/bulk` - Delete all from lab
- `POST /api/equipment/bulk-import` - Import from Excel

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## 🎨 Tech Stack

### Frontend
- React 19
- Vite 7
- Tailwind CSS
- React Router
- xlsx (Excel import/export)

### Backend
- Node.js
- Express
- Sequelize ORM
- MySQL
- JWT Authentication
- bcrypt

## 📱 Pages

1. **Dashboard** - Overview and statistics
2. **Lab Management** - Manage laboratories
3. **Equipment Inventory** - Manage equipment
4. **Bookings** - Equipment/lab bookings
5. **Calendar** - Visual booking calendar
6. **Training** - Training management
7. **Incidents** - Report and track issues
8. **Orders** - Equipment orders (Admin)
9. **Users** - User management (Admin)
10. **Maintenance** - Maintenance scheduling
11. **Reports** - Analytics and Excel reports
12. **Notifications** - System notifications

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change port in .env file or kill the process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**Database connection failed:**
- Check MySQL is running
- Verify .env credentials
- Ensure database exists

**Import not working:**
- Check Excel format matches sample
- Ensure lab_id exists
- Check file size (max 1000 items)

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributors

Developed for NEC Laboratory Management

## 📞 Support

For issues or questions, please create an issue in the repository.
