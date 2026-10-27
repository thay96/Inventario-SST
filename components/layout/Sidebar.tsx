'use client'
// Sidebar de navegación principal
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ENLACES = [
  { href: '/dashboard', texto: 'Dashboard' },
  { href: '/inventario', texto: 'Inventario' },
  { href: '/alturas', texto: 'Equipos de Altura' },
  { href: '/reportes', texto: 'Reportes' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-fondo-secundario border-r border-borde min-h-screen p-4">
      <nav className="flex flex-col gap-1">
        {ENLACES.map((enlace) => {
          const activo = pathname === enlace.href || pathname.startsWith(enlace.href + '/')
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={[
                'px-3 py-2 rounded text-sm font-medium',
                activo
                  ? 'bg-primario text-white'
                  : 'text-texto hover:bg-white',
              ].join(' ')}
            >
              {enlace.texto}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}