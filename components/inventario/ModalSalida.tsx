'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Boton from '@/components/ui/Boton'
import MensajeError from '@/components/ui/MensajeError'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { ProductoConDetalle } from '@/types/inventario'

interface ModalSalidaProps {
  abierto: boolean
  onCerrar: () => void
  producto: ProductoConDetalle
}

export default function ModalSalida({ abierto, onCerrar, producto }: ModalSalidaProps) {
  const router = useRouter()
  const [cantidad, setCantidad] = useState('')
  const [entregadoA, setEntregadoA] = useState('')
  const [cedula, setCedula] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stockDisponible = producto.stock_actual ?? 0

  function cerrar() {
    if (cargando) return
    setCantidad('')
    setEntregadoA('')
    setCedula('')
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
    if (n > stockDisponible) {
      setError(`No puedes entregar más de ${stockDisponible} unidades disponibles.`)
      return
    }
    if (!entregadoA.trim()) {
      setError('Debes indicar a quién se le entrega.')
      return
    }
    if (!cedula.trim()) {
      setError('La cédula es obligatoria.')
      return
    }

    setCargando(true)
    const supabase = crearClienteNavegador()

    const { error: errMov } = await supabase.from('movimientos').insert({
      producto_id: producto.id,
      tipo: 'salida',
      cantidad: n,
      entregado_a: entregadoA.trim(),
      cedula: cedula.trim(),
      observaciones: observaciones.trim() || null,
    })

    if (errMov) {
      setError(errMov.message)
      setCargando(false)
      return
    }

    const nuevoStock = stockDisponible - n
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
    setEntregadoA('')
    setCedula('')
    setObservaciones('')
    onCerrar()
    router.refresh()
  }

  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo={`Salida — ${producto.nombre}`}>
      <form onSubmit={manejarEnvio} className="space-y-4">
        <p className="text-xs text-texto-secundario">
          Stock disponible: <span className="font-semibold text-texto">{stockDisponible}</span>
        </p>

        <Input
          id="cantidad_salida"
          label="Cantidad a entregar"
          type="number"
          min="1"
          max={stockDisponible}
          placeholder="Ej: 1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />

        <Input
          id="entregado_a"
          label="A quién se le entrega"
          placeholder="Ej: Juan Pérez"
          value={entregadoA}
          onChange={(e) => setEntregadoA(e.target.value)}
          required
        />

        <Input
          id="cedula_salida"
          label="Cédula"
          placeholder="Ej: 1023456789"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          required
        />

        <Input
          id="obs_salida"
          label="Observaciones (opcional)"
          placeholder="Ej: Para obra Malacates"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        {error && <MensajeError mensaje={error} />}

        <div className="flex gap-3 pt-2">
          <Boton type="submit" variante="primario" cargando={cargando}>
            Registrar salida
          </Boton>
          <Boton type="button" variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Modal>
  )
}