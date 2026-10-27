import type { Metadata } from 'next'
import Link from 'next/link'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getProductosAltura, getConteoUnidades, getConteoAsignadas } from '@/lib/alturas'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import TablaProductosAltura from '@/components/alturas/TablaProductosAltura'
import Boton from '@/components/ui/Boton'

export const metadata: Metadata = {
  title: 'Equipos de Altura — SST CONEQUIPOS',
}

export default async function AlturasPage() {
  const usuario = await obtenerUsuarioServidor()
  const esAdmin = usuario?.email?.endsWith('@conequipos.com') ?? false

  const [productos, conteoUnidades, conteoAsignadas] = await Promise.all([
    getProductosAltura(),
    getConteoUnidades(),
    getConteoAsignadas(),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-texto">Equipos de Altura</h1>
              <p className="text-sm text-texto-secundario mt-1">
                {productos.length} equipo{productos.length !== 1 ? 's' : ''} registrado{productos.length !== 1 ? 's' : ''}
              </p>
            </div>
            {esAdmin && (
              <Link href="/alturas/nuevo">
                <Boton variante="primario" tamanio="sm">
                  Nuevo equipo
                </Boton>
              </Link>
            )}
          </div>

          <TablaProductosAltura
            productos={productos}
            conteoUnidades={conteoUnidades}
            conteoAsignadas={conteoAsignadas}
          />
        </main>
      </div>
    </div>
  )
}