# Military Asset Management System

A comprehensive system for managing military assets across multiple bases with role-based access control.

## Features

- **Dashboard**: Key metrics with opening/closing balances, net movements, assignments, and expenditures
- **Purchases**: Record and track asset purchases by base
- **Transfers**: Manage inter-base asset transfers with full history
- **Assignments & Expenditures**: Track asset assignments to personnel and expenditures
- **RBAC**: Role-based access control for Admin, Base Commander, and Logistics Officer

## Tech Stack

- **Frontend**: React with responsive design
- **Backend**: Node.js/Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT with role-based middleware

## Project Structure

```
military-asset-management/
├── frontend/          # React application
├── backend/           # Node.js/Express API
├── docs/             # Documentation
└── README.md
```

## Getting Started

1. Clone the repository
2. Set up MongoDB Atlas connection
3. Install dependencies for both frontend and backend
4. Configure environment variables
5. Run the development servers

## Database Schema

- **Users**: Authentication and role management
- **Bases**: Military base information
- **Assets**: Asset definitions and categories
- **Transactions**: Purchases, transfers, assignments, expenditures
- **AuditLogs**: Complete audit trail for all operations
