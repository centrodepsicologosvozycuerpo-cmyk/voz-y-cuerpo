import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      professionalId: string
      professional: {
        id: string
        slug: string
        fullName: string
        title: string
      }
    }
  }

  interface User {
    id: string
    email: string
    professionalId: string
    professional: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    professionalId: string
    professional: any
  }
}


