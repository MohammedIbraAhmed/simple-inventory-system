import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public errors: string[]

  constructor(message: string, errors: string[] = []) {
    super(message, 400)
    this.errors = errors
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

export function handleError(error: unknown): NextResponse {
  console.error('Error occurred:', error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    return NextResponse.json({
      error: 'Validation failed',
      details: errors
    }, { status: 400 })
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    const response: any = { error: error.message }

    if (error instanceof ValidationError) {
      response.details = error.errors
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle MongoDB duplicate key errors
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    return NextResponse.json({
      error: 'Duplicate entry',
      details: ['A record with this value already exists']
    }, { status: 409 })
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message

    return NextResponse.json({
      error: message
    }, { status: 500 })
  }

  // Fallback for unknown errors
  return NextResponse.json({
    error: 'An unexpected error occurred'
  }, { status: 500 })
}

// Async error wrapper for API handlers
export function asyncHandler(
  fn: (req: any, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: any, ...args: any[]): Promise<NextResponse> => {
    try {
      return await fn(req, ...args)
    } catch (error) {
      return handleError(error)
    }
  }
}

// Rate limiting error
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
  }
}

// Helper function to log errors
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` [${context}]` : ''

  console.error(`${timestamp}${contextStr}:`, error)

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service like Sentry, LogRocket, etc.
  }
}