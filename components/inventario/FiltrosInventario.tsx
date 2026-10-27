'use client'

// Filtros del inventario — categoría y búsqueda por texto.
// La búsqueda usa debounce para evitar un router.push por cada tecla.

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect, useRef } from 'react'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Boton from '@/components/ui/Boton'
import type { Categoria } from '@/types/inventario'

interface FiltrosInventarioProps {
  categorias: Categoria[]
}

export default function FiltrosInventario({ categorias }: FiltrosInventarioProps) {
  const router = useRouter()
  const params = useSearchParams()

  const categoriaActual = params.get('categoria') ?? ''
  const busquedaUrl     = params.get('busqueda') ?? ''

  // Estado local para la búsqueda (el input responde inmediato)
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaUrl)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si la URL cambia desde afuera (ej: "Limpiar filtros"), sincroniza lo local
  useEffect(() => {
    setBusquedaLocal(busquedaUrl)
  }, [busquedaUrl])

  const opcionesCategoria = [
    { valor: '', etiqueta: 'Todas las categorías' },
    ...categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
  ]

  // Actualiza la URL inmediatamente (para selects y botones)
  const actualizarFiltro = useCallback(
    (clave: string, valor: string) => {
      const nuevosParams = new URLSearchParams(params.toString())
      if (valor) {
        nuevosParams.set(clave, valor)
      } else {
        nuevosParams.delete(clave)
      }
      router.push(`/inventario?${nuevosParams.toString()}`)
    },
    [params, router]
  )

  // Búsqueda con debounce: espera 350ms tras la última tecla antes de navegar
  function handleCambioBusqueda(valor: string) {
    setBusquedaLocal(valor)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      actualizarFiltro('busqueda', valor)
    }, 350)
  }

  function limpiarFiltros() {
    setBusquedaLocal('')
    router.push('/inventario')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48">
        <Select
          id="filtro-categoria"
          label="Categoría"
          opciones={opcionesCategoria}
          value={categoriaActual}
          onChange={(e) => actualizarFiltro('categoria', e.target.value)}
        />
      </div>
      <div className="w-64">
        <Input
          id="filtro-busqueda"
          label="Buscar"
          type="search"
          placeholder="Código o nombre del producto"
          value={busquedaLocal}
          onChange={(e) => handleCambioBusqueda(e.target.value)}
        />
      </div>
      {(categoriaActual || busquedaLocal) && (
        <Boton
          variante="secundario"
          tamanio="sm"
          onClick={limpiarFiltros}
          className="self-end mb-0.5"
        >
          Limpiar filtros
        </Boton>
      )}
    </div>
  )
}