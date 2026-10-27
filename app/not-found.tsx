import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada — SST CONEQUIPOS',
}

// Página 404 — se muestra cuando la ruta no existe
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-fondo">
      <div className="max-w-sm w-full border border-borde rounded p-8 text-center">
        <p className="text-4xl font-bold text-texto-secundario">404</p>
        <h1 className="text-lg font-semibold text-texto mt-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-texto-secundario mt-2">
          La ruta que estás buscando no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-primario text-white text-sm font-medium
              rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primario"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
