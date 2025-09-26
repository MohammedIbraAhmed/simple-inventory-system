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

// Circuit breaker pattern for database connections
let failureCount = 0
let lastFailureTime = 0
const MAX_FAILURES = 5
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 seconds

export async function connectDB(): Promise<Db> {
  const now = Date.now()

  // Circuit breaker: if too many failures, wait before trying again
  if (failureCount >= MAX_FAILURES && (now - lastFailureTime) < CIRCUIT_BREAKER_TIMEOUT) {
    const remainingTime = Math.ceil((CIRCUIT_BREAKER_TIMEOUT - (now - lastFailureTime)) / 1000)
    throw new Error(`Database circuit breaker active. Try again in ${remainingTime} seconds`)
  }

  try {
    const client = await clientPromise

    // Test the connection with retry logic
    let retries = 3
    while (retries > 0) {
      try {
        await client.db('admin').admin().ping()
        break
      } catch (pingError) {
        retries--
        if (retries === 0) throw pingError
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000))
      }
    }

    // Reset failure count on successful connection
    failureCount = 0

    // Use the correct database name from the URI
    return client.db('sinv')
  } catch (error) {
    // Update failure tracking
    failureCount++
    lastFailureTime = now

    console.error('Database connection error:', error)
    console.error(`Failure count: ${failureCount}/${MAX_FAILURES}`)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out') || error.message.includes('connection <monitor> to')) {
        console.error('🔄 MongoDB Atlas Connection Issues Detected:')
        console.error('1. ✅ Check if your MongoDB Atlas cluster is running (not paused)')
        console.error('2. 🌐 Verify your IP address is whitelisted in Atlas Network Access')
        console.error('3. 🔗 Ensure your connection string is correct in .env.local')
        console.error('4. 🔥 Check your network/firewall settings')
        console.error('5. ⏰ Atlas may be experiencing high load - wait and retry')
      } else if (error.message.includes('Authentication failed')) {
        console.error('🔐 MongoDB Atlas Authentication Issues:')
        console.error('1. Verify your username and password in the connection string')
        console.error('2. Ensure the database user has proper permissions')
      } else if (error.message.includes('Socket') && error.message.includes('timed out')) {
        console.error('⚡ Network timeout detected - this is usually temporary')
        console.error('1. Check your internet connection stability')
        console.error('2. Atlas cluster might be under heavy load')
        console.error('3. Try again in a few moments')
      }
    }

    // Provide different error messages based on failure count
    if (failureCount < MAX_FAILURES) {
      throw new Error(`Database connection failed (attempt ${failureCount}/${MAX_FAILURES}). Retrying...`)
    } else {
      throw new Error(`Database connection failed after ${MAX_FAILURES} attempts. Circuit breaker activated for ${CIRCUIT_BREAKER_TIMEOUT/1000} seconds`)
    }
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