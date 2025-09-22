import { getBaseUrl } from './config'
import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

// Create reusable transporter object using SMTP transport
let transporter: nodemailer.Transporter | null = null

function createTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }
  return transporter
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email configuration not found, logging email instead:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('Content:', options.text || options.html)
      console.log('---')
      console.log('ℹ️  To enable actual email sending:')
      console.log('1. Set EMAIL_USER and EMAIL_PASS in your .env file')
      console.log('2. Configure your SMTP settings correctly')
      console.log('Current config:')
      console.log('  EMAIL_HOST:', process.env.EMAIL_HOST)
      console.log('  EMAIL_PORT:', process.env.EMAIL_PORT)
      console.log('  EMAIL_USER:', process.env.EMAIL_USER)
      console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE)
      return true
    }

    const transporter = createTransporter()

    // Test connection first with timeout
    console.log('🔍 Testing SMTP connection...')
    try {
      // Add timeout for connection test
      const verifyPromise = transporter.verify()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timeout after 10 seconds')), 10000)
      )

      await Promise.race([verifyPromise, timeoutPromise])
      console.log('✅ SMTP connection verified')
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError)

      // Log detailed error information
      if (verifyError instanceof Error) {
        console.error('Error message:', verifyError.message)
        console.error('Error stack:', verifyError.stack)
      }

      // Try to provide helpful error messages
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
      if (errorMessage.includes('ECONNREFUSED')) {
        console.error('💡 Hint: Connection refused - check if SMTP server is reachable and port is correct')
      } else if (errorMessage.includes('ENOTFOUND')) {
        console.error('💡 Hint: Host not found - check EMAIL_HOST setting')
      } else if (errorMessage.includes('Invalid login')) {
        console.error('💡 Hint: Authentication failed - check EMAIL_USER and EMAIL_PASS')
      }

      throw verifyError
    }

    // Send mail with defined transport object
    console.log(`📤 Sending email to ${options.to}...`)
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Inventory System'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log('✅ Email sent successfully:', info.messageId)
    console.log('📧 Response:', info.response)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    console.error('❌ Email configuration debug:')
    console.error('  EMAIL_HOST:', process.env.EMAIL_HOST)
    console.error('  EMAIL_PORT:', process.env.EMAIL_PORT)
    console.error('  EMAIL_USER:', process.env.EMAIL_USER)
    console.error('  EMAIL_FROM:', process.env.EMAIL_FROM)
    console.error('  EMAIL_SECURE:', process.env.EMAIL_SECURE)

    // Fallback to logging for development - show reset link in console
    console.log('📧 Email would be sent (fallback):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Content:', options.text || options.html)

    // For password reset emails, extract and show the reset link prominently
    if (options.subject.includes('Password Reset') && options.html) {
      const linkMatch = options.html.match(/href="([^"]*reset-password[^"]*)"/)
      if (linkMatch) {
        console.log('')
        console.log('🔗 PASSWORD RESET LINK (copy this to test):')
        console.log(linkMatch[1])
        console.log('')
      }
    }

    return false
  }
}

export function generatePasswordResetEmail(resetToken: string, userEmail: string) {
  const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${resetToken}`

  return {
    to: userEmail,
    subject: 'Password Reset Request - Inventory Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🔑 Password Reset Request</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for the Inventory Management System.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          margin: 16px 0;
        ">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from the Inventory Management System.
        </p>
      </div>
    `,
    text: `
      Password Reset Request

      You have requested to reset your password for the Inventory Management System.

      Click this link to reset your password: ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request this password reset, please ignore this email.
    `
  }
}

export function generateWelcomeEmail(userName: string, userEmail: string, tempPassword?: string) {
  const baseUrl = getBaseUrl()

  return {
    to: userEmail,
    subject: 'Welcome to Inventory Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Welcome to Inventory Management System</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been created in the Inventory Management System.</p>
        <p><strong>Login Details:</strong></p>
        <ul>
          <li>Email: ${userEmail}</li>
          ${tempPassword ? `<li>Temporary Password: ${tempPassword}</li>` : '<li>Password: As provided during registration</li>'}
        </ul>
        ${tempPassword ? '<p><strong>Important:</strong> Please change your password after your first login for security.</p>' : ''}
        <a href="${baseUrl}/auth/signin" style="
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          margin: 16px 0;
        ">Sign In Now</a>
        <p>If you have any questions, please contact your administrator.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from the Inventory Management System.
        </p>
      </div>
    `,
    text: `
      Welcome to Inventory Management System

      Hello ${userName},

      Your account has been created in the Inventory Management System.

      Login Details:
      - Email: ${userEmail}
      ${tempPassword ? `- Temporary Password: ${tempPassword}` : '- Password: As provided during registration'}

      ${tempPassword ? 'Important: Please change your password after your first login for security.' : ''}

      Sign in at: ${baseUrl}/auth/signin

      If you have any questions, please contact your administrator.
    `
  }
}