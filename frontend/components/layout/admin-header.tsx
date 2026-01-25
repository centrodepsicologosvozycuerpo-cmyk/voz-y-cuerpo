import { LogoutButton } from '@/components/panel/logout-button'

export function AdminHeader() {
  return (
    <header className="border-b bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <LogoutButton variant="header" />
        </div>
      </div>
    </header>
  )
}

