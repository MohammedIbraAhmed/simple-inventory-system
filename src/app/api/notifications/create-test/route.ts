import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Create a test notification for the current user
    const testNotification = {
      userId: session.user.id,
      type: 'system_alert',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working properly.',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/admin',
      metadata: {
        isTest: true
      }
    }

    await db.collection('notifications').insertOne(testNotification)

    // Also create notifications for all users
    const users = await db.collection('users').find({ isActive: true }).toArray()
    const notificationsToCreate = users.map(user => ({
      userId: user._id.toString(),
      type: 'system_alert',
      title: 'System Notification Test',
      message: `Hello ${user.name}, this is a test notification to ensure the system is working correctly.`,
      priority: 'low',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/',
      metadata: {
        isTest: true,
        createdBy: session.user.id
      }
    }))

    if (notificationsToCreate.length > 0) {
      await db.collection('notifications').insertMany(notificationsToCreate)
    }

    return NextResponse.json({
      message: `Created ${notificationsToCreate.length + 1} test notifications`,
      testNotification
    })

  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create test notifications' },
      { status: 500 }
    )
  }
}