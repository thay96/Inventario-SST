import type { Metadata } from 'next'
import Link from 'next/link'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getTotalProductos, getConteoStockCritico } from '@/lib/inventario'
import {
  getProductosAltura,
  getConteoAsignadas,
  getConteoInspeccionesPorVencer,
  getEquiposAsignadosActualmente,
  getUnidadesPorVencer,
} from '@/lib/alturas'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Card from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Dashboard — SST CONEQUIPOS',
}

function formatearFecha(fecha: string): string {
  if (!fecha) return '—'
  const [anio, mes, dia] = fecha.split('-')
  if (!anio || !mes || !dia) return fecha
  return `${dia}/${mes}/${anio}`
}

export default async function DashboardPage() {
  const [
    usuario,
    totalProductos,
    stockCritico,
    equiposAltura,
    asignadas,
    inspPorVencer,
    equiposAsignados,
    unidadesPorVencer,
  ] = await Promise.all([
    obtenerUsuarioServidor(),
    getTotalProductos(),
    getConteoStockCritico(),
    getProductosAltura(),
    getConteoAsignadas(),
    getConteoInspeccionesPorVencer(),
    getEquiposAsignadosActualmente(),
    getUnidadesPorVencer(5),
  ])

  const totalAsignadas = Object.values(asignadas).reduce((a, b) => a + b, 0)
  const mesActual = new Date().toLocaleString('es-CO', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-texto">Dashboard</h1>
            <p className="text-sm text-texto-secundario mt-1">
              Resumen general del sistema SST — {mesActual}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <Card
              etiqueta="Productos de inventario"
              valor={totalProductos}
              descripcion="Consumibles registrados"
            />
            <Card
              etiqueta="Stock crítico"
              valor={stockCritico}
              descripcion="Bajo el mínimo"
              alerta={stockCritico > 0}
            />
            <Card
              etiqueta="Equipos de altura"
              valor={equiposAltura.length}
              descripcion="Serializados registrados"
            />
            <Card
              etiqueta="Unidades asignadas"
              valor={totalAsignadas}
              descripcion="Actualmente en uso"
            />
            <Card
              etiqueta="Inspecciones por vencer"
              valor={inspPorVencer}
              descripcion="Próximas a vencer o vencidas"
              alerta={inspPorVencer > 0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="border border-borde rounded p-5">
              <h2 className="text-base font-semibold text-texto mb-4">
                Equipos asignados actualmente
              </h2>
              {equiposAsignados.length === 0 ? (
                <p className="text-sm text-texto-secundario">
                  No hay equipos asignados en este momento.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-borde">
                  {equiposAsignados.map((a) => (
                    <Link
                      key={a.id}
                      href={`/alturas/${encodeURIComponent(a.producto_id ?? '')}`}
                      className="py-3 flex items-start justify-between gap-4 hover:bg-fondo-secundario/40 px-2 -mx-2 rounded"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-texto truncate">
                          {a.trabajador}
                        </p>
                        <p className="text-xs text-texto-secundario mt-0.5 truncate">
                          {a.equipo} · #{a.unidad}
                        </p>
                      </div>
                      <p className="text-xs text-texto-secundario whitespace-nowrap">
                        {formatearFecha(a.fecha_entrega)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div
              className={[
                'border rounded p-5',
                inspPorVencer > 0
                  ? 'border-red-200 bg-red-50'
                  : 'border-borde bg-white',
              ].join(' ')}
            >
              <h2 className="text-base font-semibold text-texto mb-2">
                Alertas de inspección anual
              </h2>
              {inspPorVencer === 0 ? (
                <p className="text-sm text-texto-secundario">
                  Todas las unidades están vigentes.
                </p>
              ) : (
                <>
                  <p className="text-sm text-texto mb-3">
                    Hay{' '}
                    <span className="font-bold text-alerta">{inspPorVencer}</span>{' '}
                    unidad{inspPorVencer === 1 ? '' : 'es'} con inspección por
                    vencer en los próximos 30 días o vencidas.
                  </p>
                  <div className="divide-y divide-red-100 border-t border-red-100">
                    {unidadesPorVencer.map((u) => (
                      <Link
                        key={u.unidad_id}
                        href={`/alturas/${encodeURIComponent(u.producto_id)}`}
                        className="py-2 flex items-center justify-between gap-3 hover:bg-red-100/40 px-2 -mx-2 rounded"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-texto font-medium truncate">
                            {u.producto_nombre} · #{u.codigo_interno}
                          </p>
                          <p className="text-xs text-texto-secundario">
                            Vence {formatearFecha(u.fecha_proxima_inspeccion)}
                          </p>
                        </div>
                        <span
                          className={[
                            'text-xs font-semibold whitespace-nowrap',
                            u.dias_restantes < 0 ? 'text-alerta' : 'text-advertencia',
                          ].join(' ')}
                        >
                          {u.dias_restantes < 0
                            ? `Vencida hace ${Math.abs(u.dias_restantes)} d`
                            : `En ${u.dias_restantes} d`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}