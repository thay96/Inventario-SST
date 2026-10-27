'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import ModalConfirmacion from '@/components/ui/ModalConfirmacion'
import Boton from '@/components/ui/Boton'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Categoria } from '@/types/inventario'

interface ModalCategoriasProps {
  abierto: boolean
  onCerrar: () => void
  categorias: Categoria[]
  onCambio: (nuevas: Categoria[]) => void
}

export default function ModalCategorias({
  abierto,
  onCerrar,
  categorias,
  onCambio,
}: ModalCategoriasProps) {
  const [lista, setLista] = useState<Categoria[]>(categorias)
  const [nombreNueva, setNombreNueva] = useState('')
  const [guardandoNueva, setGuardandoNueva] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const [porBorrar, setPorBorrar] = useState<Categoria | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [infoBloqueo, setInfoBloqueo] = useState<string | null>(null)

  async function crearCategoria() {
    const nombre = nombreNueva.trim()
    if (!nombre) return
    setGuardandoNueva(true)
    setAviso(null)
    const supabase = crearClienteNavegador()

    const { data: existente } = await supabase
      .from('categorias')
      .select('id, nombre, descripcion, orden')
      .ilike('nombre', nombre)
      .maybeSingle()

    if (existente) {
      setAviso(`Ya existía "${existente.nombre}".`)
      setGuardandoNueva(false)
      setNombreNueva('')
      return
    }

    const { data: maxOrden } = await supabase
      .from('categorias')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nuevaOrden = (maxOrden?.orden ?? 0) + 1

    const { data: creada, error } = await supabase
      .from('categorias')
      .insert({ nombre, orden: nuevaOrden })
      .select('id, nombre, descripcion, orden')
      .single()

    setGuardandoNueva(false)
    setNombreNueva('')

    if (error || !creada) {
      setAviso('Error al crear la categoría.')
      return
    }

    const actualizadas = [...lista, creada as Categoria]
    setLista(actualizadas)
    onCambio(actualizadas)
    setAviso(`Categoría "${creada.nombre}" creada.`)
  }

  async function intentarEliminar(cat: Categoria) {
    const supabase = crearClienteNavegador()
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', cat.id)

    if (count && count > 0) {
      setInfoBloqueo(
        `La categoría "${cat.nombre}" tiene ${count} producto${count === 1 ? '' : 's'} asociado${count === 1 ? '' : 's'}. Elimina o cambia de categoría esos productos primero.`
      )
      return
    }
    setPorBorrar(cat)
  }

  async function confirmarBorrado() {
    if (!porBorrar) return
    setBorrando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase.from('categorias').delete().eq('id', porBorrar.id)
    setBorrando(false)

    if (error) {
      setPorBorrar(null)
      return
    }

    const actualizadas = lista.filter((c) => c.id !== porBorrar.id)
    setLista(actualizadas)
    onCambio(actualizadas)
    setPorBorrar(null)
  }

  return (
    <>
      <Modal abierto={abierto} onCerrar={onCerrar} titulo="Administrar categorías" ancho="grande">
        <div className="flex flex-col gap-4">
          <div className="border border-borde rounded p-3 bg-fondo-secundario">
            <label className="text-xs font-medium text-texto block mb-2">
              Nueva categoría
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: SEÑALIZACIÓN, PROTECCIÓN AUDITIVA"
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void crearCategoria()
                  }
                }}
                className="flex-1 border border-borde rounded px-3 py-2 text-sm text-texto bg-white focus:outline-none focus:ring-2 focus:ring-primario"
              />
              <Boton
                type="button"
                variante="primario"
                tamanio="sm"
                onClick={crearCategoria}
                cargando={guardandoNueva}
                disabled={!nombreNueva.trim()}
              >
                Crear
              </Boton>
            </div>
            {aviso && (
              <p className="text-xs text-texto-secundario mt-2">{aviso}</p>
            )}
          </div>

          <div className="border border-borde rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fondo-secundario border-b border-borde">
                  <th className="text-left px-4 py-3 font-semibold text-texto">Categoría</th>
                  <th className="text-right px-4 py-3 font-semibold text-texto">Orden</th>
                  <th className="text-center px-4 py-3 font-semibold text-texto">·</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-texto-secundario text-sm">
                      No hay categorías registradas.
                    </td>
                  </tr>
                )}
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-borde last:border-0 hover:bg-fondo-secundario/50">
                    <td className="px-4 py-3 text-texto font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-right text-texto-secundario">{c.orden ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => { void intentarEliminar(c) }}
                        className="p-1 text-texto-secundario hover:text-alerta"
                        title="Eliminar categoría"
                        aria-label="Eliminar categoría"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        titulo="¿Deseas eliminar esta categoría?"
        mensaje={`Se eliminará "${porBorrar?.nombre ?? ''}" de forma permanente.`}
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