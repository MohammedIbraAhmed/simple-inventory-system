import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'
import { ObjectId } from 'mongodb'
import { Notification } from '@/types/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unread') === 'true'

    const db = await connectDB()

    const query: any = { userId: session.user.id }
    if (unreadOnly) {
      query.isRead = false
    }

    const notifications = await db
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      type,
      title,
      message,
      priority = 'medium',
      actionUrl,
      metadata
    } = body

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await connectDB()

    const notification: Omit<Notification, '_id'> = {
      userId,
      type,
      title,
      message,
      priority,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl,
      metadata
    }

    const result = await db.collection('notifications').insertOne(notification)

    return NextResponse.json({
      message: 'Notification created successfully',
      notificationId: result.insertedId
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// Bulk notification creation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notifications } = body

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notifications array' },
        { status: 400 }
      )
    }

    const db = await connectDB()

    const notificationDocs = notifications.map(notification => ({
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString()
    }))

    const result = await db.collection('notifications').insertMany(notificationDocs)

    return NextResponse.json({
      message: `${result.insertedCount} notifications created successfully`,
      insertedIds: result.insertedIds
    })

  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    )
  }
}