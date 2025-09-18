# Simple Inventory Management System

A clean, simple inventory management system built with Next.js, Auth.js, MongoDB, and TypeScript.

## Features

- **Product Management**: Add, edit, delete products with name, SKU, stock, and price
- **Authentication**: Secure login system with Auth.js
- **Dashboard**: Real-time metrics showing total products, inventory value, and low stock alerts
- **Search**: Real-time search by product name or SKU
- **Stock Tracking**: Visual indicators for low stock items (< 10 units)
- **Responsive Design**: Works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Authentication**: Auth.js (NextAuth.js)
- **Database**: MongoDB
- **Styling**: Inline CSS (keeping it simple)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-inventory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```
MONGODB_URI=mongodb://localhost:27017/simple-inventory
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Default Login
- Email: `admin@inventory.com`
- Password: `admin`

### Adding Products
1. Use the "Add New Product" form
2. Fill in Name, SKU, Stock quantity, and Price
3. Click "Add Product"

### Managing Inventory
- **Edit**: Click the green "Edit" button on any product
- **Delete**: Click the red "Delete" button (with confirmation)
- **Search**: Use the search bar to find products by name or SKU
- **Low Stock**: Products with less than 10 units are highlighted in red

### Dashboard Metrics
- **Total Products**: Count of all products in inventory
- **Total Value**: Sum of (price × stock) for all products
- **Low Stock Items**: Count of products below minimum threshold

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```
MONGODB_URI=your-mongodb-atlas-connection-string
NEXTAUTH_SECRET=generate-a-secure-random-string
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Features Roadmap

- [ ] Categories for products
- [ ] Barcode scanning
- [ ] Inventory reports
- [ ] Multiple users/roles
- [ ] Stock movement history
- [ ] Export to CSV/Excel
- [ ] Product images
- [ ] Supplier management