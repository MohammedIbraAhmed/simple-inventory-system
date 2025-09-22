import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()
    const testEmail = email || session.user.email

    // Test email configuration
    const testEmailContent = {
      to: testEmail,
      subject: 'Email Test - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>✅ Email Test Successful</h2>
          <p>Hello,</p>
          <p>This is a test email to verify that the email service is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>To: ${testEmail}</li>
            <li>From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</li>
            <li>SMTP Host: ${process.env.EMAIL_HOST}</li>
            <li>SMTP Port: ${process.env.EMAIL_PORT}</li>
          </ul>
          <p>If you received this email, the email service is configured correctly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from the Inventory Management System for testing purposes.
          </p>
        </div>
      `,
      text: `
        Email Test Successful

        This is a test email to verify that the email service is working correctly.

        Test Details:
        - Sent at: ${new Date().toLocaleString()}
        - To: ${testEmail}
        - From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}
        - SMTP Host: ${process.env.EMAIL_HOST}
        - SMTP Port: ${process.env.EMAIL_PORT}

        If you received this email, the email service is configured correctly!
      `
    }

    console.log('🧪 Testing email service...')
    console.log('📧 Email configuration:')
    console.log('- Host:', process.env.EMAIL_HOST)
    console.log('- Port:', process.env.EMAIL_PORT)
    console.log('- User:', process.env.EMAIL_USER)
    console.log('- From:', process.env.EMAIL_FROM)
    console.log('- Secure:', process.env.EMAIL_SECURE)

    const emailSent = await sendEmail(testEmailContent)

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        emailConfiguration: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          from: process.env.EMAIL_FROM,
          secure: process.env.EMAIL_SECURE
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Test email failed to send',
        emailConfiguration: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          from: process.env.EMAIL_FROM,
          secure: process.env.EMAIL_SECURE
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test email service',
      details: error instanceof Error ? error.message : 'Unknown error',
      emailConfiguration: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        from: process.env.EMAIL_FROM,
        secure: process.env.EMAIL_SECURE
      }
    }, { status: 500 })
  }
}