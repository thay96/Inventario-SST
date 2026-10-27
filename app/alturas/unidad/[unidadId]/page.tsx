import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { obtenerUsuarioServidor } from '@/lib/auth'
import { getUnidadPorId, getProductoAlturaPorId } from '@/lib/alturas'
import { getAsignacionActiva, getHistorialAsignaciones } from '@/lib/asignaciones'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import FormularioAsignacion from '@/components/alturas/FormularioAsignacion'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Detalle de unidad — SST CONEQUIPOS',
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  disponible: 'DISPONIBLE',
  asignado: 'ASIGNADO',
  mantenimiento: 'EN MANTENIMIENTO',
  baja: 'DADO DE BAJA',
}

function varianteEstado(estado: string | null): 'bueno' | 'critico' | 'pendiente' | 'advertencia' {
  if (estado === 'disponible') return 'bueno'
  if (estado === 'asignado') return 'advertencia'
  if (estado === 'mantenimiento') return 'pendiente'
  if (estado === 'baja') return 'critico'
  return 'pendiente'
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO')
}

interface PageProps {
  params: Promise<{ unidadId: string }>
}

export default async function UnidadDetallePage({ params }: PageProps) {
  const { unidadId } = await params
  const usuario = await obtenerUsuarioServidor()

  const unidad = await getUnidadPorId(unidadId)
  if (!unidad) notFound()

  const producto = unidad.producto_id
    ? await getProductoAlturaPorId(unidad.producto_id)
    : null

  const [asignacionActiva, historial] = await Promise.all([
    getAsignacionActiva(unidadId),
    getHistorialAsignaciones(unidadId),
  ])

  const esAdmin = usuario?.email?.endsWith('@conequipos.com') ?? false
  const puedeAsignar = esAdmin && (unidad.estado === 'disponible' || unidad.estado === 'asignado')

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar emailUsuario={usuario?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link
              href={producto ? `/alturas/${producto.id}` : '/alturas'}
              className="text-sm text-texto-secundario hover:text-texto"
            >
              ← Volver a unidades
            </Link>
            <div className="flex items-center justify-between mt-3">
              <div>
                <h1 className="text-xl font-semibold text-texto">
                  {producto?.nombre ?? 'Unidad'} #{unidad.codigo_interno}
                </h1>
                <p className="text-sm text-texto-secundario mt-1">
                  Número interno: <span className="font-mono">{unidad.codigo_interno}</span>
                </p>
              </div>
              <Badge
                variante={varianteEstado(unidad.estado)}
                texto={ETIQUETAS_ESTADO[unidad.estado ?? ''] ?? (unidad.estado ?? '—').toUpperCase()}
              />
            </div>
          </div>

          {/* Datos de la unidad */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-2xl">
            <div className="border border-borde rounded p-4">
              <p className="text-xs text-texto-secundario uppercase mb-1">Ubicación</p>
              <p className="text-sm text-texto">{unidad.ubicacion ?? '—'}</p>
            </div>
            <div className="border border-borde rounded p-4">
              <p className="text-xs text-texto-secundario uppercase mb-1">Inspección anual</p>
              <p className="text-sm text-texto">
                {formatearFecha(unidad.fecha_proximo_mantenimiento)}
              </p>
            </div>
            {unidad.observaciones && (
              <div className="border border-borde rounded p-4 col-span-2">
                <p className="text-xs text-texto-secundario uppercase mb-1">Observaciones</p>
                <p className="text-sm text-texto">{unidad.observaciones}</p>
              </div>
            )}
          </div>

          {/* Asignación */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-texto mb-3">
              {asignacionActiva ? 'Asignación actual' : 'Asignar unidad'}
            </h2>
            {puedeAsignar ? (
              <FormularioAsignacion
                unidadId={unidadId}
                asignacionActiva={asignacionActiva}
              />
            ) : (
              <p className="text-sm text-texto-secundario">
                {unidad.estado === 'baja'
                  ? 'Esta unidad está dada de baja. No se puede asignar.'
                  : unidad.estado === 'mantenimiento'
                    ? 'Esta unidad está en mantenimiento. No se puede asignar.'
                    : 'No tienes permisos para asignar unidades.'}
              </p>
            )}
          </div>

          {/* Historial */}
          {historial.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-texto mb-3">Historial de asignaciones</h2>
              <div className="border border-borde rounded overflow-hidden max-w-3xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-fondo-secundario border-b border-borde">
                      <th className="text-left px-4 py-2 font-semibold text-texto">Entregado a</th>
                      <th className="text-left px-4 py-2 font-semibold text-texto">Entrega</th>
                      <th className="text-left px-4 py-2 font-semibold text-texto">Devolución</th>
                      <th className="text-left px-4 py-2 font-semibold text-texto">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((a, i) => (
                      <tr
                        key={a.id}
                        className={[
                          'border-b border-borde last:border-0',
                          i % 2 === 0 ? 'bg-white' : 'bg-fondo-secundario',
                        ].join(' ')}
                      >
                        <td className="px-4 py-2 text-texto">{a.entregado_a ?? '—'}</td>
                        <td className="px-4 py-2 text-texto-secundario">
                          {formatearFecha(a.fecha_entrega)}
                        </td>
                        <td className="px-4 py-2 text-texto-secundario">
                          {a.activa ? 'Activa' : formatearFecha(a.fecha_devolucion)}
                        </td>
                        <td className="px-4 py-2 text-texto-secundario">
                          {a.observaciones ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}