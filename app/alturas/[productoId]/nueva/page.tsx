import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getProductoAlturaPorId } from '@/lib/alturas'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import FormularioUnidad from '@/components/alturas/FormularioUnidad'

export const metadata: Metadata = {
  title: 'Agregar unidad — SST CONEQUIPOS',
}

interface PageProps {
  params: Promise<{ productoId: string }>
}

export default async function NuevaUnidadPage({ params }: PageProps) {
  const { productoId } = await params
  const usuario = await obtenerUsuarioServidor()

  const producto = await getProductoAlturaPorId(productoId)
  if (!producto) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link
              href={`/alturas/${productoId}`}
              className="text-sm font-semibold text-texto hover:underline"
            >
              ← Volver a unidades
            </Link>
            <h1 className="text-xl font-semibold text-texto mt-3">Agregar unidad</h1>
            <p className="text-sm text-texto-secundario mt-1">
              {producto.nombre}
              {producto.codigo ? ` · Código: ${producto.codigo}` : ''}
            </p>
          </div>

          <FormularioUnidad productoId={productoId} />
        </main>
      </div>
    </div>
  )
}