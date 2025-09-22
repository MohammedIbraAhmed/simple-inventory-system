import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log all environment variables for debugging
    console.log('🔍 Email Environment Variables:')
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST)
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT)
    console.log('EMAIL_USER:', process.env.EMAIL_USER)
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***set***' : 'NOT SET')
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
    console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE)

    // Test creating transporter
    let transporter
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
      console.log('✅ Transporter created successfully')
    } catch (transporterError) {
      console.error('❌ Failed to create transporter:', transporterError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create email transporter',
        details: transporterError instanceof Error ? transporterError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Test SMTP connection
    try {
      console.log('🔍 Testing SMTP connection...')
      await transporter.verify()
      console.log('✅ SMTP connection successful!')

      return NextResponse.json({
        success: true,
        message: 'SMTP connection test successful',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          secure: process.env.EMAIL_SECURE,
          hasPassword: !!process.env.EMAIL_PASS
        }
      })
    } catch (smtpError) {
      console.error('❌ SMTP connection failed:', smtpError)

      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed',
        details: smtpError instanceof Error ? smtpError.message : 'Unknown error',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          secure: process.env.EMAIL_SECURE,
          hasPassword: !!process.env.EMAIL_PASS
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Email connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test email connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}