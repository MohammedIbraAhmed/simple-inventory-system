const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-inventory'

console.log('MongoDB URI:', uri)
try {
  const url = new URL(uri)
  console.log('URL pathname:', url.pathname)
  console.log('Database name from URL:', url.pathname.substring(1))
} catch (error) {
  console.error('Error parsing URL:', error)
}