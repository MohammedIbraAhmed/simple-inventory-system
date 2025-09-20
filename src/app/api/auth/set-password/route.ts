import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// Admin sets password for new users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Update user with password
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          passwordSetAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    )

    return NextResponse.json({ message: 'Password set successfully' })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}

// User changes their own password
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({
      _id: session.user.id,
      isActive: true
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const { verifyPassword } = await import('@/lib/auth-utils')
    const isValidPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    )

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}