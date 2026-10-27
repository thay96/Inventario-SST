'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Boton from '@/components/ui/Boton'
import MensajeError from '@/components/ui/MensajeError'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { ProductoConDetalle } from '@/types/inventario'

interface ModalEntradaProps {
  abierto: boolean
  onCerrar: () => void
  producto: ProductoConDetalle
}

export default function ModalEntrada({ abierto, onCerrar, producto }: ModalEntradaProps) {
  const router = useRouter()
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cerrar() {
    if (cargando) return
    setCantidad('')
    setObservaciones('')
    setError(null)
    onCerrar()
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const n = parseInt(cantidad, 10)
    if (isNaN(n) || n <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }

    setCargando(true)
    const supabase = crearClienteNavegador()

    const { error: errMov } = await supabase.from('movimientos').insert({
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: n,
      entregado_a: null,
      observaciones: observaciones.trim() || null,
    })

    if (errMov) {
      setError(errMov.message)
      setCargando(false)
      return
    }

    const nuevoStock = (producto.stock_actual ?? 0) + n
    const { error: errProd } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock })
      .eq('id', producto.id)

    if (errProd) {
      setError(errProd.message)
      setCargando(false)
      return
    }

    setCargando(false)
    setCantidad('')
    setObservaciones('')
    onCerrar()
    router.refresh()
  }

  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo={`Entrada — ${producto.nombre}`}>
      <form onSubmit={manejarEnvio} className="space-y-4">
        <p className="text-xs text-texto-secundario">
          Stock actual: <span className="font-semibold text-texto">{producto.stock_actual ?? 0}</span>
          {' '}· Mínimo: <span className="font-semibold text-texto">{producto.stock_minimo ?? 0}</span>
        </p>

        <Input
          id="cantidad_entrada"
          label="Cantidad que ingresa"
          type="number"
          min="1"
          placeholder="Ej: 10"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />

        <Input
          id="obs_entrada"
          label="Observaciones (opcional)"
          placeholder="Ej: Compra a proveedor X"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        {error && <MensajeError mensaje={error} />}

        <div className="flex gap-3 pt-2">
          <Boton type="submit" variante="primario" cargando={cargando}>
            Registrar entrada
          </Boton>
          <Boton type="button" variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Modal>
  )
}