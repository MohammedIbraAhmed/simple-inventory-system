import { connectDB } from './db'

export interface AuditLog {
  action: string
  userId: string
  userEmail: string
  resourceId?: string
  resourceType?: string
  details?: Record<string, any>
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(auditData: Omit<AuditLog, 'timestamp'>): Promise<void> {
  try {
    const db = await connectDB()

    const auditLog: AuditLog = {
      ...auditData,
      timestamp: new Date().toISOString()
    }

    await db.collection('audit_logs').insertOne(auditLog)
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw error - audit logging should not break the main operation
  }
}

// Predefined audit actions for consistency
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Product management
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',

  // Workshop management
  CREATE_WORKSHOP: 'CREATE_WORKSHOP',
  UPDATE_WORKSHOP: 'UPDATE_WORKSHOP',
  DELETE_WORKSHOP: 'DELETE_WORKSHOP',
  COMPLETE_WORKSHOP: 'COMPLETE_WORKSHOP',

  // User management
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  ALLOCATE_MATERIALS: 'ALLOCATE_MATERIALS',

  // Distribution
  DISTRIBUTE_MATERIALS: 'DISTRIBUTE_MATERIALS',
  RETURN_MATERIALS: 'RETURN_MATERIALS',
  UPDATE_STOCK: 'UPDATE_STOCK',

  // Participant management
  REGISTER_PARTICIPANT: 'REGISTER_PARTICIPANT',
  UPDATE_PARTICIPANT: 'UPDATE_PARTICIPANT',
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',

  // System
  BACKUP_CREATED: 'BACKUP_CREATED',
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED'
} as const

// Helper functions for common audit scenarios
export async function logProductAction(
  action: string,
  userId: string,
  userEmail: string,
  productId: string,
  productDetails: Record<string, any>,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    userId,
    userEmail,
    resourceId: productId,
    resourceType: 'product',
    details: { ...productDetails, ...additionalDetails }
  })
}

export async function logWorkshopAction(
  action: string,
  userId: string,
  userEmail: string,
  workshopId: string,
  workshopDetails: Record<string, any>,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    userId,
    userEmail,
    resourceId: workshopId,
    resourceType: 'workshop',
    details: { ...workshopDetails, ...additionalDetails }
  })
}

export async function logDistributionAction(
  action: string,
  userId: string,
  userEmail: string,
  distributionDetails: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    userId,
    userEmail,
    resourceType: 'distribution',
    details: distributionDetails
  })
}

export async function logUserAction(
  action: string,
  performedByUserId: string,
  performedByUserEmail: string,
  targetUserId: string,
  userDetails: Record<string, any>,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    userId: performedByUserId,
    userEmail: performedByUserEmail,
    resourceId: targetUserId,
    resourceType: 'user',
    details: { ...userDetails, ...additionalDetails }
  })
}

// Function to retrieve audit logs with pagination and filtering
export async function getAuditLogs(filters: {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<AuditLog[]> {
  try {
    const db = await connectDB()

    const query: any = {}

    if (filters.userId) query.userId = filters.userId
    if (filters.action) query.action = filters.action
    if (filters.resourceType) query.resourceType = filters.resourceType

    if (filters.startDate || filters.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = filters.startDate
      if (filters.endDate) query.timestamp.$lte = filters.endDate
    }

    const auditLogs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .skip(filters.offset || 0)
      .toArray()

    return auditLogs as unknown as AuditLog[]
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error)
    throw error
  }
}