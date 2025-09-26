import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from './db'

export interface DatabaseHandler<T = any> {
  (db: any, request: NextRequest, ...args: any[]): Promise<NextResponse<T>>
}

/**
 * Wraps database operations with enhanced error handling
 * Provides graceful degradation and user-friendly error messages
 */
export function withDatabaseErrorHandling<T = any>(
  handler: DatabaseHandler<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    try {
      const db = await connectDB()
      return await handler(db, request, ...args)
    } catch (error) {
      console.error('Database operation failed:', error)

      // Extract meaningful error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error'

      // Handle different types of database errors
      if (errorMessage.includes('circuit breaker active')) {
        return NextResponse.json({
          error: 'Database temporarily unavailable',
          details: 'Our database is experiencing high load. Please try again in a few moments.',
          retryAfter: 30,
          type: 'circuit_breaker'
        }, { status: 503 }) // Service Unavailable
      }

      if (errorMessage.includes('connection failed') || errorMessage.includes('timed out')) {
        return NextResponse.json({
          error: 'Database connection timeout',
          details: 'Unable to connect to the database. This is usually temporary.',
          retryAfter: 5,
          type: 'connection_timeout'
        }, { status: 503 }) // Service Unavailable
      }

      if (errorMessage.includes('Server selection timed out')) {
        return NextResponse.json({
          error: 'Database server unavailable',
          details: 'Our database cluster is currently unavailable. Please try again later.',
          retryAfter: 10,
          type: 'server_selection_timeout'
        }, { status: 503 }) // Service Unavailable
      }

      // Generic database error
      return NextResponse.json({
        error: 'Database error',
        details: 'An unexpected database error occurred. Please try again.',
        type: 'database_error'
      }, { status: 500 }) // Internal Server Error
    }
  }
}

/**
 * Middleware for handling database operations with retry logic
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain types of errors
      if (error instanceof Error) {
        if (error.message.includes('circuit breaker active') ||
            error.message.includes('Authentication failed') ||
            error.message.includes('not found') ||
            error.message.includes('duplicate key')) {
          throw error
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Health check endpoint helper
 */
export async function createHealthCheckResponse(): Promise<NextResponse> {
  try {
    const db = await connectDB()

    // Perform a simple operation to verify database functionality
    await db.admin().ping()

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}