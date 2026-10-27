'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import ModalEntrada from '@/components/inventario/ModalEntrada'
import ModalSalida from '@/components/inventario/ModalSalida'
import ModalHistorial from '@/components/inventario/ModalHistorial'
import ModalConfirmacion from '@/components/ui/ModalConfirmacion'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { ProductoConDetalle } from '@/types/inventario'

interface TablaInventarioProps {
  productos: ProductoConDetalle[]
}

type ModalActivo =
  | { tipo: 'entrada'; producto: ProductoConDetalle }
  | { tipo: 'salida'; producto: ProductoConDetalle }
  | { tipo: 'historial'; producto: ProductoConDetalle }
  | null

type Dialogo =
  | { tipo: 'confirmar'; producto: ProductoConDetalle }
  | { tipo: 'bloqueado'; producto: ProductoConDetalle }
  | null

export default function TablaInventario({ productos }: TablaInventarioProps) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalActivo>(null)
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [eliminando, setEliminando] = useState(false)

  async function iniciarEliminacion(producto: ProductoConDetalle) {
    const supabase = crearClienteNavegador()
    const { count, error } = await supabase
      .from('movimientos')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', producto.id)

    if (error) {
      setDialogo({ tipo: 'bloqueado', producto })
      return
    }

    if ((count ?? 0) > 0) {
      setDialogo({ tipo: 'bloqueado', producto })
      return
    }

    setDialogo({ tipo: 'confirmar', producto })
  }

  async function confirmarEliminacion() {
    if (dialogo?.tipo !== 'confirmar') return
    setEliminando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', dialogo.producto.id)

    setEliminando(false)
    if (error) {
      setDialogo({ tipo: 'bloqueado', producto: dialogo.producto })
      return
    }
    setDialogo(null)
    router.refresh()
  }

  if (productos.length === 0) {
    return (
      <div className="border border-borde rounded p-8 text-center">
        <p className="text-texto-secundario text-sm">
          No hay productos registrados. Crea uno con "Nuevo producto".
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-borde rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-fondo-secundario border-b border-borde">
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Código</th>
              <th className="text-left px-4 py-3 font-semibold text-texto">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Categoría</th>
              <th className="text-right px-4 py-3 font-semibold text-texto whitespace-nowrap">Stock actual</th>
              <th className="text-right px-4 py-3 font-semibold text-texto whitespace-nowrap">Stock mínimo</th>
              <th className="text-left px-4 py-3 font-semibold text-texto">Ubicación física</th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-texto whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto, index) => (
              <tr
                key={producto.id}
                className={[
                  'border-b border-borde last:border-0',
                  index % 2 === 0 ? 'bg-white' : 'bg-fondo-secundario',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-mono text-xs text-texto font-semibold whitespace-nowrap">
                  {producto.codigo ?? '—'}
                </td>
                <td className="px-4 py-3 text-texto font-medium">
                  {producto.nombre}
                </td>
                <td className="px-4 py-3 text-texto font-medium whitespace-nowrap">
                  {producto.categoria?.nombre ?? '—'}
                </td>
                <td
                  className={[
                    'px-4 py-3 text-right font-semibold',
                    producto.stock_critico ? 'text-alerta' : 'text-exito',
                  ].join(' ')}
                >
                  {producto.stock_actual}
                </td>
                <td className="px-4 py-3 text-right text-texto font-medium">
                  {producto.stock_minimo}
                </td>
                <td className="px-4 py-3 text-texto">
                  {producto.ubicacion ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variante={producto.stock_critico ? 'critico' : 'bueno'}
                    texto={producto.stock_critico ? 'CRÍTICO' : 'Normal'}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ tipo: 'entrada', producto })}
                      className="px-2 py-1 text-xs border border-borde rounded text-exito hover:bg-fondo-secundario font-medium"
                    >
                      + Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ tipo: 'salida', producto })}
                      className="px-2 py-1 text-xs border border-borde rounded text-alerta hover:bg-fondo-secundario font-medium"
                    >
                      − Salida
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ tipo: 'historial', producto })}
                      className="p-1 text-texto-secundario hover:text-primario"
                      title="Ver historial"
                      aria-label="Ver historial"
                    >
                      🕒
                    </button>
                    <button
                      type="button"
                      onClick={() => iniciarEliminacion(producto)}
                      className="p-1 text-texto-secundario hover:text-alerta"
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.tipo === 'entrada' && (
        <ModalEntrada abierto onCerrar={() => setModal(null)} producto={modal.producto} />
      )}
      {modal?.tipo === 'salida' && (
        <ModalSalida abierto onCerrar={() => setModal(null)} producto={modal.producto} />
      )}
      {modal?.tipo === 'historial' && (
        <ModalHistorial abierto onCerrar={() => setModal(null)} producto={modal.producto} />
      )}

      <ModalConfirmacion
        abierto={dialogo?.tipo === 'confirmar'}
        onCerrar={() => !eliminando && setDialogo(null)}
        onConfirmar={confirmarEliminacion}
        titulo="Eliminar producto"
        mensaje={`¿Estás seguro de eliminar el producto "${dialogo?.producto.nombre ?? ''}"?\n\nEsta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        variante="peligro"
        cargando={eliminando}
      />

          <ModalConfirmacion
        abierto={dialogo?.tipo === 'bloqueado'}
        onCerrar={() => setDialogo(null)}
        onConfirmar={() => setDialogo(null)}
        titulo="No se puede eliminar"
        mensaje={`No se puede eliminar el producto "${dialogo?.producto.nombre ?? ''}" porque tiene movimientos registrados en su historial. Esta información es requerida para auditorías de SST.`}
        textoConfirmar="Entendido"
        variante="info"
      />
    </>
  )
}