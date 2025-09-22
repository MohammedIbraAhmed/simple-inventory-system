import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db'
import { verifyPassword } from '@/lib/auth-utils'
import { validateData, LoginSchema } from '@/lib/validations'
import { getBaseUrl } from '@/lib/config'

export const authOptions = {
  session: {
    strategy: 'jwt' as const,
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Validate input
          const validation = validateData(LoginSchema, credentials)
          if (!validation.success) {
            return null
          }

          const { email, password } = validation.data as { email: string; password: string }
          const db = await connectDB()

          // Find user in database (case-insensitive email lookup)
          const user = await db.collection('users').findOne({
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
            isActive: true
          })

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password)
          if (!isValidPassword) {
            return null
          }

          // Return user object
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.userId as string
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      // Use environment variable for base URL
      const envBaseUrl = getBaseUrl()

      // If url is relative, prepend base URL
      if (url.startsWith('/')) {
        return `${envBaseUrl}${url}`
      }

      // If url starts with base URL, allow it
      if (url.startsWith(envBaseUrl) || url.startsWith(baseUrl)) {
        return url
      }

      // Default to base URL
      return envBaseUrl
    }
  }
}