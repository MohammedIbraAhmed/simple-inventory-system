import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'
import { NotificationPreferences } from '@/types/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    let preferences = await db.collection('notificationPreferences').findOne({
      userId: session.user.id
    })

    // Create default preferences if none exist
    if (!preferences) {
      const defaultPreferences: Omit<NotificationPreferences, '_id'> = {
        userId: session.user.id,
        emailNotifications: {
          lowStock: true,
          workshopReminders: true,
          systemAlerts: true,
          adminAlerts: session.user.role === 'admin'
        },
        pushNotifications: {
          lowStock: true,
          workshopReminders: true,
          systemAlerts: true,
          adminAlerts: session.user.role === 'admin'
        },
        lowStockThreshold: 10,
        workshopReminderDays: [7, 1], // Remind 7 days and 1 day before
        updatedAt: new Date().toISOString()
      }

      const result = await db.collection('notificationPreferences').insertOne(defaultPreferences)
      preferences = { ...defaultPreferences, _id: result.insertedId }
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = {
      ...body,
      updatedAt: new Date().toISOString()
    }

    // Remove _id and userId from updates to prevent accidental modification
    delete updates._id
    delete updates.userId

    const db = await connectDB()

    const result = await db.collection('notificationPreferences').updateOne(
      { userId: session.user.id },
      { $set: updates },
      { upsert: true }
    )

    // Fetch updated preferences
    const preferences = await db.collection('notificationPreferences').findOne({
      userId: session.user.id
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences
    })

  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}