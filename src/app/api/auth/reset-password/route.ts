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

    console.log('🔄 Password reset request for email:', email)

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ email, isActive: true })

    if (!user) {
      console.log('❌ User not found or inactive for email:', email)
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
    }

    console.log('✅ User found:', { email: user.email, userId: user._id })

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    console.log('🔑 Generated reset token:', {
      token: `${resetToken.substring(0, 8)}...`,
      expiry: resetTokenExpiry
    })

    // Store reset token in database
    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date().toISOString()
        }
      }
    )

    console.log('📝 Token stored in database:', {
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    })

    // Generate and send password reset email
    console.log('📧 Generating password reset email...')
    const emailContent = generatePasswordResetEmail(resetToken, user.email)
    console.log('📤 Attempting to send email...')
    const emailSent = await sendEmail(emailContent)

    console.log('📧 Email send result:', emailSent)

    if (emailSent) {
      console.log('✅ Password reset process completed successfully')
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent'
        // resetToken removed for security - should never be exposed to client
      })
    } else {
      console.log('⚠️ Email sending failed, but not revealing to client')
      // Even if email fails, don't reveal if user exists
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent'
      })
    }
  } catch (error) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json({ error: 'Failed to process reset request' }, { status: 500 })
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    console.log('🔄 Password reset attempt:', {
      token: token ? `${token.substring(0, 8)}...` : 'missing',
      passwordLength: newPassword?.length || 0
    })

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const db = await connectDB()

    // First, let's find if the token exists at all
    const tokenExists = await db.collection('users').findOne({
      resetToken: token,
      isActive: true
    })

    console.log('🔍 Token search result:', {
      tokenExists: !!tokenExists,
      tokenExpiry: tokenExists?.resetTokenExpiry,
      currentTime: new Date(),
      isExpired: tokenExists ? new Date() > new Date(tokenExists.resetTokenExpiry) : 'N/A'
    })

    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
      isActive: true
    })

    if (!user) {
      if (tokenExists) {
        return NextResponse.json({ error: 'Reset token has expired. Please request a new password reset.' }, { status: 400 })
      } else {
        return NextResponse.json({ error: 'Invalid reset token. Please request a new password reset.' }, { status: 400 })
      }
    }

    console.log('✅ Valid token found for user:', { email: user.email, userId: user._id })

    // Hash new password
    console.log('🔐 Hashing new password...')
    const hashedPassword = await hashPassword(newPassword)
    console.log('✅ Password hashed successfully')

    // Update password and remove reset token
    const updateResult = await db.collection('users').updateOne(
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

    console.log('📝 Database update result:', {
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    })

    if (updateResult.modifiedCount === 0) {
      console.error('❌ No documents were modified during password update')
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    console.log('✅ Password reset completed successfully for user:', user.email)
    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}