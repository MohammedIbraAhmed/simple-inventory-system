# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple physical inventory management system built with Next.js, Auth.js, MongoDB, and shadcn/ui. The system allows users to manage product inventory, track stock movements, and organize products by categories.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with sample data (when implemented)
npm run db:migrate   # Run database migrations (when implemented)
```

## Architecture Overview

### Database Schema (MongoDB)
- **products**: Product catalog with SKU, name, description, pricing, and stock levels
- **categories**: Product categorization system
- **stockMovements**: Audit trail for all inventory transactions (in/out/adjustments)
- **users**: User management handled by Auth.js with role-based access (admin/staff/viewer)

### API Structure
- `/api/products/*` - Product CRUD operations
- `/api/categories/*` - Category management
- `/api/stock-movements/*` - Stock transaction tracking
- `/api/reports/*` - Inventory reporting (low stock, inventory value)
- `/api/dashboard` - Dashboard summary data

### Frontend Architecture
- **App Router**: Using Next.js 14+ app directory structure
- **shadcn/ui Components**: Data tables, forms, cards, dialogs for consistent UI
- **Role-based Access**: Different permissions for admin/staff/viewer roles
- **Real-time Updates**: Stock levels update automatically after movements

### Key Features
- Product management with SKU tracking
- Stock level monitoring with minimum stock alerts
- Inventory movement logging (purchases, sales, adjustments)
- Category-based organization
- Dashboard with key metrics and low stock alerts
- Search and filtering capabilities

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/inventory-system
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## File Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── products/          # Product management pages
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── tables/           # Data table components
├── lib/                  # Utility functions and configurations
│   ├── db.ts            # MongoDB connection
│   ├── auth.ts          # Auth.js configuration
│   └── validations.ts   # Zod schemas
└── types/               # TypeScript type definitions
```

## Development Guidelines

### Data Validation
- All forms use Zod schemas for validation
- API endpoints validate input data before processing
- Stock movements are logged with user attribution

### Security
- Role-based access control enforced at API level
- Input sanitization for all user inputs
- Audit trail for all inventory changes

### Performance
- Database indexes on frequently queried fields (SKU, category, userId)
- Pagination for large product lists
- Optimistic updates for better UX