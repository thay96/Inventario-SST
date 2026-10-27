import type { Metadata } from 'next'
import FormularioLogin from '@/components/auth/FormularioLogin'

export const metadata: Metadata = {
  title: 'Iniciar sesión — SST CONEQUIPOS',
  description: 'Acceso al sistema de inventario de seguridad de CONEQUIPOS.',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-fondo flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-texto tracking-tight">
            CONEQUIPOS
          </h1>
          <h2 className="text-sm font-semibold text-texto uppercase tracking-wider mt-2">
            Sistema de Inventario y Seguridad
          </h2>
          <p className="text-xs text-texto-secundario mt-1">
            Seguridad y Salud en el Trabajo
          </p>
        </div>

        <div className="border border-borde rounded p-6 bg-white">
          <h2 className="text-base font-semibold text-texto mb-4">
            Ingresar al sistema
          </h2>
          <FormularioLogin />
        </div>

        <p className="text-xs text-texto-secundario text-center mt-6">
          CONEQUIPOS S.A.S. — Solo personal autorizado
        </p>
      </div>
    </main>
  )
}