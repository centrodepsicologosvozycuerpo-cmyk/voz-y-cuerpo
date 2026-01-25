'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'header'
}

export function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  if (variant === 'header') {
    return (
      <Button 
        variant="ghost" 
        onClick={handleLogout}
        className="text-white hover:bg-slate-800 hover:text-white border border-slate-600"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Cerrar Sesión
    </Button>
  )
}

