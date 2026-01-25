export function AdminFooter() {
  return (
    <footer className="border-t bg-slate-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Panel de Administración - Equipo de Psicología</p>
          <p className="mt-2 text-xs">Acceso restringido a personal autorizado</p>
        </div>
      </div>
    </footer>
  )
}


