import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    const result = await db.collection('notifications').updateMany(
      {
        userId: session.user.id,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date().toISOString()
        }
      }
    )

    return NextResponse.json({
      message: `${result.modifiedCount} notifications marked as read`
    })

  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}