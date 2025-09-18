import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.email === 'admin@inventory.com' && credentials?.password === 'admin') {
          return { id: '1', email: 'admin@inventory.com', name: 'Admin' }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async session({ session, token }) {
      return session
    }
  }
})

export { handler as GET, handler as POST }