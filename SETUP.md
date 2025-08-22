# Military Asset Management System - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd military-asset-management
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
- **MONGODB_URI**: Your MongoDB connection string
- **JWT_SECRET**: A secure random string for JWT tokens
- **PORT**: Server port (default: 5000)

### 4. Database Setup

Seed the database with initial data:
```bash
npm run seed
```

This creates:
- Sample bases (Fort Liberty, Camp Pendleton, etc.)
- Default user accounts with different roles
- Sample assets and inventory data

### 5. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## Default Login Credentials

After running the seed script, use these credentials:

- **Admin**: `admin` / `admin123`
- **Fort Liberty Commander**: `commander.fl` / `commander123`
- **Fort Liberty Logistics**: `logistics.fl` / `logistics123`
- **Camp Pendleton Commander**: `commander.cp` / `commander123`
- **Camp Pendleton Logistics**: `logistics.cp` / `logistics123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/movements` - Get movement details

### Transactions
- `POST /api/transactions/purchase` - Record purchase
- `POST /api/transactions/transfer` - Create transfer
- `POST /api/transactions/assignment` - Create assignment
- `POST /api/transactions/expenditure` - Record expenditure
- `GET /api/transactions` - Get transactions with filters

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (admin only)
- `PUT /api/assets/:id` - Update asset (admin only)
- `DELETE /api/assets/:id` - Deactivate asset (admin only)

### Bases
- `GET /api/bases` - Get all bases
- `GET /api/bases/:id` - Get base by ID
- `POST /api/bases` - Create base (admin only)
- `PUT /api/bases/:id` - Update base (admin only)
- `DELETE /api/bases/:id` - Deactivate base (admin only)

## Role-Based Access Control

### Admin
- Full access to all data and operations
- Can manage users, bases, and assets
- Access to all bases

### Base Commander
- Access to their assigned base data
- Can create assignments and expenditures
- Can view and create purchases and transfers for their base

### Logistics Officer
- Access to their assigned base data
- Can create purchases and transfers
- Limited access to assignments and expenditures

## Database Schema

### Collections
- **users** - User accounts and authentication
- **bases** - Military base information
- **assets** - Asset definitions and categories
- **transactions** - All asset movements (purchases, transfers, assignments, expenditures)
- **inventory** - Current inventory levels per base
- **auditlogs** - Complete audit trail

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Request logging and audit trails
- Input validation and sanitization
- Secure password hashing

## Development

### Running Tests
```bash
cd backend
npm test
```

### Code Structure
```
backend/
├── config/          # Database and logger configuration
├── controllers/     # Request handlers
├── middleware/      # Authentication and authorization
├── models/          # MongoDB schemas
├── routes/          # API route definitions
├── scripts/         # Database seeding and utilities
└── server.js        # Main application entry point

frontend/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── contexts/    # React context providers
│   ├── pages/       # Page components
│   └── App.js       # Main application component
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MongoDB is running
   - Check MONGODB_URI in .env file
   - Ensure network connectivity for MongoDB Atlas

2. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check if user account exists and is active
   - Ensure correct credentials

3. **Permission Denied**
   - Verify user role and base assignment
   - Check if accessing correct base data
   - Ensure user account is active

### Logs
- Backend logs are stored in `backend/logs/`
- Check `error.log` for error details
- Use `combined.log` for general application logs

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure MongoDB Atlas for production
4. Set up proper CORS origins
5. Configure reverse proxy (nginx)
6. Set up SSL/TLS certificates
7. Configure monitoring and logging
