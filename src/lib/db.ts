import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env')
}

const uri = process.env.MONGODB_URI
const options = {
  // Connection pool optimization for better concurrency
  maxPoolSize: 25, // Increased from 10 to support more concurrent users
  minPoolSize: 5, // Maintain minimum connections for faster response

  // Timeout optimization for faster failure detection
  serverSelectionTimeoutMS: 10000, // Reduced from 30000 for faster failure detection
  socketTimeoutMS: 20000, // Reduced from 45000 for quicker timeout
  maxIdleTimeMS: 30000, // Keep idle connection timeout
  connectTimeoutMS: 10000, // Reduced from 30000 for faster initial connection

  // Reliability features
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads

  // Atlas-specific optimizations
  ssl: true, // Enable SSL for Atlas
  appName: 'InventoryManagementSystem_v2', // Updated app name for monitoring

  // Performance optimizations
  maxConnecting: 5, // Limit concurrent connection attempts
  heartbeatFrequencyMS: 30000, // Health check frequency

  // Compression for better network performance
  compressors: ['zlib'], // Enable compression for better network utilization
  zlibCompressionLevel: 6, // Balanced compression level
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// In development mode, use a global variable so that the value
// is preserved across module reloads caused by HMR (Hot Module Replacement).
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function connectDB(): Promise<Db> {
  try {
    const client = await clientPromise
    // Test the connection
    await client.db('admin').admin().ping()
    // Use the correct database name from the URI
    return client.db('sinv')
  } catch (error) {
    console.error('Database connection error:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out')) {
        console.error('Atlas Connection Help:')
        console.error('1. Check if your MongoDB Atlas cluster is running (not paused)')
        console.error('2. Verify your IP address is whitelisted in Atlas Network Access')
        console.error('3. Ensure your connection string is correct')
        console.error('4. Check your network/firewall settings')
      } else if (error.message.includes('Authentication failed')) {
        console.error('Atlas Authentication Help:')
        console.error('1. Verify your username and password in the connection string')
        console.error('2. Ensure the database user has proper permissions')
      }
    }

    throw new Error('Failed to connect to database')
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  try {
    const client = await clientPromise
    await client.close()
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Health check function
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const db = await connectDB()
    await db.admin().ping()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}