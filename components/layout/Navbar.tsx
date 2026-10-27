'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { logout } from '@/lib/auth-cliente'
import Boton from '@/components/ui/Boton'

interface NavbarProps {
  emailUsuario: string | undefined
}

export default function Navbar({ emailUsuario }: NavbarProps) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setCargando(true)
    setError(null)
    const resultado = await logout()
    if (resultado.error) {
      setError(resultado.error)
      setCargando(false)
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-20 bg-white border-b border-borde flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="h-14 flex items-center">
          <Image
            src="/imag/conequipos.png"
            alt="CONEQUIPOS"
            width={4000}
            height={354}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <span className="text-lg font-bold text-texto tracking-tight">
            SST CONEQUIPOS
          </span>
          <span className="text-sm text-texto font-medium mt-0.5">
            Sistema de Inventario y Seguridad
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {error && <span className="text-xs text-alerta">{error}</span>}
        {emailUsuario && (
          <span className="text-sm text-texto-secundario">{emailUsuario}</span>
        )}
        <Boton
          variante="secundario"
          tamanio="sm"
          onClick={handleLogout}
          cargando={cargando}
        >
          Cerrar sesión
        </Boton>
      </div>
    </header>
  )
}