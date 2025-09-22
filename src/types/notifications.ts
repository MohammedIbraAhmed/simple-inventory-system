export interface Notification {
  _id?: string
  userId: string
  type: 'low_stock' | 'workshop_reminder' | 'system_alert' | 'user_action' | 'admin_alert'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: string
  readAt?: string
  actionUrl?: string
  metadata?: {
    productId?: string
    workshopId?: string
    relatedUserId?: string
    [key: string]: any
  }
}

export interface NotificationPreferences {
  _id?: string
  userId: string
  emailNotifications: {
    lowStock: boolean
    workshopReminders: boolean
    systemAlerts: boolean
    adminAlerts: boolean
  }
  pushNotifications: {
    lowStock: boolean
    workshopReminders: boolean
    systemAlerts: boolean
    adminAlerts: boolean
  }
  lowStockThreshold: number
  workshopReminderDays: number[]
  updatedAt: string
}

export interface SystemAlert {
  _id?: string
  type: 'maintenance' | 'update' | 'warning' | 'error'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  isActive: boolean
  startTime: string
  endTime?: string
  affectedUsers: ('all' | 'admin' | 'user')[]
  createdBy: string
  metadata?: Record<string, any>
}