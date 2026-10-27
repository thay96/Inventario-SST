'use client'

// Página de error global — captura errores no manejados en Server Components
// Se muestra cuando un throw llega hasta el límite de error del App Router

import { useEffect } from 'react'
import Boton from '@/components/ui/Boton'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Registrar el error en consola para debugging
  useEffect(() => {
    console.error('[Error de aplicación]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-fondo">
      <div className="max-w-md w-full border border-borde rounded p-8">
        <h1 className="text-xl font-semibold text-texto">
          Ocurrió un error
        </h1>
        <p className="text-sm text-texto-secundario mt-2">
          No se pudo completar la operación. Esto puede deberse a un problema
          de conexión o un error interno del sistema.
        </p>

        {/* Mostrar detalles técnicos solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-fondo-secundario border border-borde rounded">
            <p className="text-xs font-mono text-texto-secundario break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-texto-secundario mt-1">
                ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Boton variante="primario" onClick={reset}>
            Intentar de nuevo
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => window.location.href = '/dashboard'}
          >
            Ir al inicio
          </Boton>
        </div>
      </div>
    </div>
  )
}
