import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Get all active users
    const users = await db.collection('users').find({ isActive: true }).toArray()

    let created = 0
    let existing = 0

    for (const user of users) {
      // Check if user already has preferences
      const existingPrefs = await db.collection('notificationPreferences').findOne({
        userId: user._id.toString()
      })

      if (!existingPrefs) {
        // Create default preferences
        const defaultPreferences = {
          userId: user._id.toString(),
          emailNotifications: {
            lowStock: true,
            workshopReminders: true,
            systemAlerts: true,
            adminAlerts: true
          },
          pushNotifications: {
            lowStock: true,
            workshopReminders: true,
            systemAlerts: true,
            adminAlerts: true
          },
          lowStockThreshold: 10,
          workshopReminderDays: [1, 3, 7],
          updatedAt: new Date().toISOString()
        }

        await db.collection('notificationPreferences').insertOne(defaultPreferences)
        created++
      } else {
        existing++
      }
    }

    return NextResponse.json({
      message: `Notification preferences initialized. Created: ${created}, Existing: ${existing}`,
      created,
      existing,
      totalUsers: users.length
    })

  } catch (error) {
    console.error('Error initializing notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to initialize notification preferences' },
      { status: 500 }
    )
  }
}