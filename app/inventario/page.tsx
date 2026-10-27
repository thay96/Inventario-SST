  import type { Metadata } from 'next'
import { Suspense } from 'react'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getProductos, getCategorias } from '@/lib/inventario'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import TablaInventario from '@/components/inventario/TablaInventario'
import FiltrosInventario from '@/components/inventario/FiltrosInventario'
import Boton from '@/components/ui/Boton'
import Link from 'next/link'
import type { FiltrosInventario as TFiltros } from '@/types/inventario'



export const metadata: Metadata = {
  title: 'Inventario — SST CONEQUIPOS',
}

interface InventarioPageProps {
  searchParams: Promise<{ categoria?: string; busqueda?: string }>
}

export default async function InventarioPage({ searchParams }: InventarioPageProps) {
  const params = await searchParams
  const usuario = await obtenerUsuarioServidor()

  // Construir filtros desde los query params de la URL
  // La categoría ahora es un UUID (id de la tabla categorias)
  const filtros: TFiltros = {
    categoriaId: params.categoria || '',
    busqueda: params.busqueda || '',
    tipoControl: '',
  }

// Traer productos y categorías en paralelo
  const [productos, categorias] = await Promise.all([
    getProductos(filtros),
    getCategorias(),
  ])  

  const esAdmin = usuario?.email?.endsWith('@conequipos.com') ?? false


  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-texto">Inventario</h1>
              <p className="text-sm text-texto-secundario mt-1">
                {productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}
              </p>
            </div>
            {esAdmin && (
              <Link href="/inventario/nuevo">
                <Boton variante="primario" tamanio="sm">
                  Nuevo producto
                </Boton>
              </Link>
            )}
          </div>

          {/* Filtros — Client Component envuelto en Suspense */}
          <div className="mb-4">
            <Suspense fallback={<div className="h-10" />}>
              <FiltrosInventario categorias={categorias} />
            </Suspense>
          </div>

          {/* Tabla de inventario */}
        <TablaInventario productos={productos} />
        </main>
      </div>
    </div>
  )
}
