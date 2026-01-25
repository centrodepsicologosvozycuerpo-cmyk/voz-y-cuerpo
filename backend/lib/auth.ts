import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials')
            return null
          }

          console.log('🔍 Looking for user:', credentials.email)

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              professional: true,
            },
          })

          if (!user) {
            console.log('❌ User not found')
            return null
          }

          if (!user.professional) {
            console.log('❌ Professional not found for user')
            return null
          }

          if (!user.professional.isActive) {
            console.log('❌ Professional is not active')
            return null
          }

          console.log('🔐 Comparing password...')
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Authentication successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            professionalId: user.professionalId,
            professional: user.professional,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.professionalId = (user as any).professionalId
        token.professional = (user as any).professional
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).professionalId = token.professionalId
        ;(session.user as any).professional = token.professional
      }
      return session
    },
  },
  pages: {
    signIn: '/panel/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-change-in-production',
}

