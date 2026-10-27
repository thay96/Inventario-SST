'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import ModalConfirmacion from '@/components/ui/ModalConfirmacion'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { TablaAsignacion } from '@/types/supabase'

interface ModalHistorialUnidadProps {
  abierto: boolean
  onCerrar: () => void
  unidadId: string
  codigoInterno: string
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—'
  const [anio, mes, dia] = fecha.split('-')
  if (!anio || !mes || !dia) {
    const d = new Date(fecha)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-CO')
  }
  return `${dia}/${mes}/${anio}`
}

export default function ModalHistorialUnidad({
  abierto,
  onCerrar,
  unidadId,
  codigoInterno,
}: ModalHistorialUnidadProps) {
  const router = useRouter()
  const [historial, setHistorial] = useState<TablaAsignacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [porBorrar, setPorBorrar] = useState<TablaAsignacion | null>(null)
  const [borrando, setBorrando] = useState(false)

  function cargar() {
    setCargando(true)
    const supabase = crearClienteNavegador()
    supabase
      .from('asignaciones')
      .select('*')
      .eq('unidad_id', unidadId)
      .order('fecha_entrega', { ascending: false })
      .then(({ data }) => {
        setHistorial((data ?? []) as TablaAsignacion[])
        setCargando(false)
      })
  }

  useEffect(() => {
    if (!abierto) return
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, unidadId])

  async function confirmarBorrado() {
    if (!porBorrar) return
    setBorrando(true)
    const supabase = crearClienteNavegador()

    // If deleting an active assignment, revert unit state to disponible
    if (porBorrar.activa) {
      await supabase
        .from('unidades')
        .update({ estado: 'disponible' })
        .eq('id', unidadId)
    }

    const { error } = await supabase
      .from('asignaciones')
      .delete()
      .eq('id', porBorrar.id)

    setBorrando(false)
    setPorBorrar(null)
    if (error) return

    cargar()
    router.refresh()
  }

  return (
    <>
      <Modal
        abierto={abierto}
        onCerrar={onCerrar}
        titulo={`Historial — Unidad #${codigoInterno}`}
        ancho="grande"
      >
        {cargando && (
          <p className="text-sm text-texto-secundario text-center py-6">Cargando…</p>
        )}

        {!cargando && historial.length === 0 && (
          <p className="text-sm text-texto-secundario text-center py-6">
            Esta unidad no tiene asignaciones registradas.
          </p>
        )}

        {!cargando && historial.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-borde">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-fondo-secundario">
                <tr className="border-b border-borde">
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Asignado a</th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Entrega</th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Devolución</th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Obs. asignación</th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Obs. devolución</th>
                  <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Estado</th>
                  <th className="text-center px-2 py-3 font-semibold text-texto whitespace-nowrap">·</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-borde last:border-0 hover:bg-fondo-secundario/50"
                  >
                    <td className="px-4 py-3 text-texto font-medium">{a.entregado_a}</td>
                    <td className="px-4 py-3 text-texto-secundario whitespace-nowrap">
                      {formatearFecha(a.fecha_entrega)}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario whitespace-nowrap">
                      {formatearFecha(a.fecha_devolucion)}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {a.observaciones ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {a.observaciones_devolucion ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {a.activa ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-exito">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          DEVUELTO
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPorBorrar(a)}
                        className="p-1 text-texto-secundario hover:text-alerta"
                        title="Eliminar registro del historial"
                        aria-label="Eliminar registro del historial"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-5">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full px-4 py-2 border border-borde rounded text-sm hover:bg-fondo-secundario"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      <ModalConfirmacion
        abierto={porBorrar !== null}
        onCerrar={() => !borrando && setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
        titulo="¿Deseas eliminar este registro del historial?"
        mensaje={
          porBorrar?.activa
            ? 'Esta asignación está ACTIVA. Si la eliminas, la unidad volverá a estar DISPONIBLE.'
            : 'Se eliminará el registro del historial de forma permanente.'
        }
        textoConfirmar="Sí, eliminar"
        variante="peligro"
        cargando={borrando}
      />
    </>
  )
}