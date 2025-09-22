/**
 * Configuration utilities for the application
 */

/**
 * Get the base URL for the application
 * Priority: BASE_URL -> NEXTAUTH_URL -> localhost:3002 fallback
 */
export function getBaseUrl(): string {
  // In server-side context, use environment variables
  if (typeof window === 'undefined') {
    return process.env.BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3002'
  }

  // In client-side context, use window.location
  return `${window.location.protocol}//${window.location.host}`
}

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Application configuration
 */
export const config = {
  app: {
    name: 'Inventory Management System',
    description: 'Comprehensive inventory and workshop management solution',
  },
  auth: {
    passwordMinLength: 6,
    resetTokenExpiryHours: 1,
  },
  api: {
    defaultPageSize: 25,
    maxPageSize: 100,
  }
} as const