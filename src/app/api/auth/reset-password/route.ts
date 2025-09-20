import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email-service'
import crypto from 'crypto'

// Generate password reset token
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ email, isActive: true })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date().toISOString()
        }
      }
    )

    // Generate and send password reset email
    const emailContent = generatePasswordResetEmail(resetToken, user.email)
    const emailSent = await sendEmail(emailContent)

    if (emailSent) {
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent',
        resetToken // Remove this in production - only for development
      })
    } else {
      // Even if email fails, don't reveal if user exists
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent'
      })
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Failed to process reset request' }, { status: 500 })
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
      isActive: true
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password and remove reset token
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString()
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: ''
        }
      }
    )

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}