# 🎪 Simple Inventory Management System

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A comprehensive inventory management system built specifically for workshop management, material distribution, and participant tracking. Designed for humanitarian organizations, community centers, and educational institutions managing workshops and resource distribution.

## 🌟 Key Features

### 🎯 **Workshop Management**
- **Auto-Generated Workshop Codes**: Unique codes with format `[UserInitials]-[YYYYMMDD]-[LocationCode]-[Counter]`
  - Example: `AH-20250923-GZCE-001` (Ahmed Hassan, Sep 23 2025, Gaza Community Center East, #001)
- **Complete Workshop Lifecycle**: Plan → Execute → Complete → Report
- **Real-time Status Tracking**: Planned, Ongoing, Completed, Cancelled
- **Location Integration**: Link workshops to specific locations with GPS coordinates
- **Material Usage Tracking**: Track all materials distributed during workshops

### 👥 **Participant Management**
- **Comprehensive Registration**: Name, Age, Gender, ID Number, Phone
- **Gender Tracking**: Male 👨 / Female 👩 / Other 🏳️‍⚧️ with visual indicators
- **Special Status Tracking**:
  - 🦽 Disabled
  - 🩹 Wounded
  - 💔 Separated
  - 👤 Unaccompanied
- **Attendance Management**: Registered → Attended → No Show
- **Material Receipt Tracking**: Individual tracking of materials received

### 📦 **Inventory & Material Distribution**
- **User Balance System**: Personal material allocations per user
- **Bulk Distribution**: Distribute materials to all workshop participants at once
- **Individual Distribution**: Targeted material distribution to specific participants
- **Real-time Stock Updates**: Automatic inventory adjustments
- **Distribution History**: Complete audit trail of all material movements

### 🏢 **Location Management**
- **Gaza Strip Locations**: Comprehensive location database
- **GPS Coordinates**: Precise location tracking
- **Neighborhood Mapping**: Detailed area coverage
- **Site Manager Information**: Contact details and responsibilities
- **Demographics Tracking**: Population and children statistics
- **Location Requests**: User-initiated location creation/modification requests

### 📊 **Advanced Dashboard & Analytics**
- **Real-time Metrics**: Workshop statistics, participant counts, material usage
- **Performance Analytics**: Success rates, attendance patterns, resource utilization
- **Interactive Charts**: Visual representation of data trends
- **Low Stock Alerts**: Automatic notifications for inventory management
- **User Activity Tracking**: Monitor system usage and performance

### 🔔 **Notification System**
- **Smart Alerts**: Low stock warnings, workshop reminders, system updates
- **Customizable Preferences**: User-controlled notification settings
- **Real-time Updates**: Instant notifications for critical events
- **Email Integration**: Automated email notifications for important events
- **Notification History**: Track and manage all system notifications

### 🎛️ **Admin Panel**
- **User Management**: Create, edit, deactivate users with role-based access
- **System Configuration**: Global settings and preferences
- **Bulk Operations**: Import/export data, batch processing
- **Security Controls**: Password policies, session management
- **Audit Logs**: Complete activity tracking and logging

### 📈 **Reporting System**
- **Workshop Reports**: Detailed analytics for each workshop
- **Participant Statistics**: Demographics, attendance, special needs analysis
- **Material Usage Reports**: Distribution patterns and inventory insights
- **Export Capabilities**: PDF, Excel, CSV formats
- **Custom Date Ranges**: Flexible reporting periods

### 🔐 **Security & Authentication**
- **NextAuth.js Integration**: Secure authentication system
- **Role-Based Access Control**: Admin, Staff, Viewer permissions
- **Session Management**: Secure user sessions
- **Password Security**: Hashed passwords with bcrypt
- **API Security**: Protected endpoints with middleware

### 🎨 **Modern UI/UX**
- **shadcn/ui Components**: Professional, accessible interface
- **Responsive Design**: Mobile-first, works on all devices
- **Dark/Light Mode**: Theme switching capability
- **Intuitive Navigation**: User-friendly interface design
- **Fast Performance**: Optimized with Next.js and Turbo

### 🔄 **Data Management**
- **Import/Export**: Excel, CSV support for bulk operations
- **Database Optimization**: Indexed collections for performance
- **Data Validation**: Comprehensive input validation with Zod
- **Backup Systems**: Automated data protection
- **Migration Tools**: Database schema updates and seeding

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium UI components
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless functions
- **MongoDB** - NoSQL database
- **NextAuth.js** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email services

### DevOps & Tools
- **TypeScript** - Static typing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Turbo** - Fast development builds

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB database
- npm or yarn

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/inventory-system

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/simple-inventory-system.git
   cd simple-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Seed the database with sample data
   npm run seed

   # Or create just an admin user
   npm run create-admin
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with default credentials:
     - **Admin**: `admin@admin.com` / `password`
     - **User**: `ahmed@workshop.com` / `user123!`

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbo
npm run build           # Build for production
npm run start           # Start production server

# Database Management
npm run seed            # Seed database with sample data
npm run create-admin    # Create admin user
npm run optimize-db     # Optimize database indexes

# Testing & Analysis
npm run test-connection # Test database connection
npm run analyze-bundle  # Analyze bundle size
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── workshops/    # Workshop management
│   │   ├── participants/ # Participant management
│   │   ├── locations/    # Location management
│   │   ├── products/     # Inventory management
│   │   ├── notifications/# Notification system
│   │   └── reports/      # Reporting system
│   ├── dashboard/         # Main dashboard
│   ├── workshops/         # Workshop pages
│   ├── admin/            # Admin panel
│   ├── locations/        # Location management
│   ├── distributions/    # Material distribution
│   ├── reports/          # Reporting interface
│   └── auth/             # Authentication pages
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx        # Navigation component
│   ├── footer.tsx        # Footer component
│   └── ...               # Other components
├── lib/                  # Utility functions
│   ├── db.ts            # MongoDB connection
│   ├── auth-config.ts   # NextAuth configuration
│   ├── auth-middleware.ts# Authentication middleware
│   └── workshop-utils.ts # Workshop utilities
├── types/               # TypeScript definitions
└── styles/              # Global styles

scripts/                 # Database scripts
├── seed.ts             # Database seeding
├── create-admin.ts     # Admin user creation
└── optimize-database.ts# Database optimization
```

## 🎯 User Roles & Permissions

### 👑 **Admin**
- Full system access
- User management
- Global settings
- System monitoring
- All workshop and location management

### 👨‍💼 **Staff/User**
- Manage own workshops
- Register participants
- Distribute materials
- View assigned locations
- Access personal dashboard

### 👁️ **Viewer** (Future)
- Read-only access
- View reports
- Dashboard overview

## 🔧 Configuration

### Database Collections
- `users` - User accounts and profiles
- `workshops` - Workshop information and status
- `participants` - Workshop participant details
- `locations` - Geographic locations
- `products` - Inventory items
- `user_balances` - Material allocations
- `notifications` - System notifications
- `audit_logs` - Activity tracking

### Key Features Configuration
- Workshop code generation patterns
- Notification preferences
- Material distribution rules
- Location management settings
- User role permissions

## 📱 Mobile Responsive

The system is fully responsive and works seamlessly across:
- 📱 Mobile phones (iOS/Android)
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktop computers

## 🌍 Localization

Currently supports:
- **English** (Primary)
- Ready for Arabic localization
- Unicode support for all languages

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Configure production MongoDB URI
- Set secure NEXTAUTH_SECRET
- Configure email service (optional)
- Set up domain-specific NEXTAUTH_URL

### Performance Optimizations
- Automatic image optimization
- Bundle splitting and lazy loading
- Database indexing
- API response caching
- Static page generation where applicable

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database by [MongoDB](https://mongodb.com/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

## 📞 Support

For support, email support@example.com or create an issue in the GitHub repository.

---

**Made with ❤️ for humanitarian organizations and community workshops**