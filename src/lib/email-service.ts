export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Nodemailer with SMTP

    // For development/demo purposes, we'll just log the email
    console.log('📧 Email would be sent:')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Content:', options.text || options.html)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function generatePasswordResetEmail(resetToken: string, userEmail: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

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
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" style="
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

      Sign in at: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin

      If you have any questions, please contact your administrator.
    `
  }
}