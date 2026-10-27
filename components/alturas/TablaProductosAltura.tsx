'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ModalConfirmacion from '@/components/ui/ModalConfirmacion'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { TablaProducto } from '@/types/supabase'

interface TablaProductosAlturaProps {
  productos: TablaProducto[]
  conteoUnidades: Record<string, number>
  conteoAsignadas: Record<string, number>
}

export default function TablaProductosAltura({
  productos,
  conteoUnidades,
  conteoAsignadas,
}: TablaProductosAlturaProps) {
  const router = useRouter()

  const [porBorrar, setPorBorrar] = useState<TablaProducto | null>(null)
  const [borrando, setBorrando] = useState(false)

  const [infoBloqueo, setInfoBloqueo] = useState<string | null>(null)

  function intentarEliminar(p: TablaProducto) {
    const totalUnidades = conteoUnidades[p.id] ?? 0
    if (totalUnidades > 0) {
      setInfoBloqueo(
        `"${p.nombre}" tiene ${totalUnidades} unidad${totalUnidades === 1 ? '' : 'es'} registrada${totalUnidades === 1 ? '' : 's'}. Elimina primero las unidades.`
      )
      return
    }
    setPorBorrar(p)
  }

  async function confirmarBorrado() {
    if (!porBorrar) return
    setBorrando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase.from('productos').delete().eq('id', porBorrar.id)
    setBorrando(false)
    setPorBorrar(null)
    if (error) return
    router.refresh()
  }

  if (productos.length === 0) {
    return (
      <div className="border border-borde rounded p-8 text-center">
        <p className="text-texto-secundario text-sm">
          Aún no hay equipos de altura registrados.
        </p>
        <p className="text-texto-secundario text-xs mt-2">
          Crea un producto con tipo <span className="font-mono">serializado</span> desde Inventario.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-borde rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-fondo-secundario border-b border-borde">
              <th className="text-left px-4 py-3 font-semibold text-texto">Equipo</th>
              <th className="text-left px-4 py-3 font-semibold text-texto">Código</th>
              <th className="text-right px-4 py-3 font-semibold text-texto">Total unidades</th>
              <th className="text-right px-4 py-3 font-semibold text-texto">Asignadas</th>
              <th className="text-right px-4 py-3 font-semibold text-texto">Disponibles</th>
              <th className="text-center px-4 py-3 font-semibold text-texto">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, index) => {
              const total = conteoUnidades[p.id] ?? 0
              const asignadas = conteoAsignadas[p.id] ?? 0
              const disponibles = total - asignadas
              return (
                <tr
                  key={p.id}
                  className={[
                    'border-b border-borde last:border-0',
                    index % 2 === 0 ? 'bg-white' : 'bg-fondo-secundario',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 text-texto font-medium">
                    <Link href={`/alturas/${p.id}`} className="text-primario hover:underline">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-texto-secundario">
                    {p.codigo ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-texto font-semibold">{total}</td>
                  <td className="px-4 py-3 text-right text-texto-secundario">{asignadas}</td>
                  <td className="px-4 py-3 text-right text-texto-secundario">{disponibles}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => intentarEliminar(p)}
                      className="p-1 text-texto-secundario hover:text-alerta"
                      title="Eliminar equipo"
                      aria-label="Eliminar equipo"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ModalConfirmacion
        abierto={porBorrar !== null}
        onCerrar={() => !borrando && setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
        titulo="¿Deseas eliminar este equipo?"
        mensaje={`Se eliminará "${porBorrar?.nombre ?? ''}" de forma permanente. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        variante="peligro"
        cargando={borrando}
      />

      <ModalConfirmacion
        abierto={infoBloqueo !== null}
        onCerrar={() => setInfoBloqueo(null)}
        onConfirmar={() => setInfoBloqueo(null)}
        titulo="No se puede eliminar"
        mensaje={infoBloqueo ?? ''}
        textoConfirmar="Entendido"
        variante="info"
      />
    </>
  )
}