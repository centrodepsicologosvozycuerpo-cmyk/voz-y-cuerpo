import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Proteger todas las rutas /panel/* excepto /panel/login
        if (req.nextUrl.pathname.startsWith('/panel') && req.nextUrl.pathname !== '/panel/login') {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/panel/:path*'],
}


