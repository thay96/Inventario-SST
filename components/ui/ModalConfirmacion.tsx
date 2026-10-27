'use client'

import Modal from '@/components/ui/Modal'

interface ModalConfirmacionProps {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: () => void
  titulo: string
  mensaje: string
  textoConfirmar?: string
  variante?: 'peligro' | 'info'
  cargando?: boolean
}

export default function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar',
  variante = 'peligro',
  cargando = false,
}: ModalConfirmacionProps) {
  const esInfo = variante === 'info'

  return (
    <Modal abierto={abierto} onCerrar={cargando ? () => {} : onCerrar} titulo={titulo}>
      <p className="text-sm text-texto leading-relaxed whitespace-pre-line">{mensaje}</p>

      <div className="pt-6">
        {esInfo ? (
          <button
            type="button"
            onClick={onConfirmar}
            className="w-full px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {textoConfirmar}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onConfirmar}
              disabled={cargando}
              className="flex-1 px-4 py-2 rounded text-sm font-medium text-white bg-alerta hover:opacity-90 disabled:opacity-50"
            >
              {cargando ? 'Procesando…' : textoConfirmar}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="flex-1 px-4 py-2 border border-borde rounded text-sm hover:bg-fondo-secundario disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}