import type { Metadata } from 'next'
import Link from 'next/link'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getUltimoCodigoAltura } from '@/lib/alturas'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import FormularioProductoAltura from '@/components/alturas/FormularioProductoAltura'

export const metadata: Metadata = {
  title: 'Nuevo equipo de altura — SST CONEQUIPOS',
}

export default async function NuevoEquipoAlturaPage() {
  const usuario = await obtenerUsuarioServidor()
  const codigoSugerido = await getUltimoCodigoAltura()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link
              href="/alturas"
              className="text-sm text-texto-secundario hover:text-texto"
            >
              ← Volver a Equipos de Altura
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-texto mb-6">Nuevo equipo de altura</h1>

          <FormularioProductoAltura codigoSugerido={codigoSugerido} />
        </main>
      </div>
    </div>
  )
}