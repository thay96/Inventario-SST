'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Boton from '@/components/ui/Boton'
import MensajeError from '@/components/ui/MensajeError'
import ModalCategorias from '@/components/inventario/ModalCategorias'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { prefijoCategoria } from '@/lib/codigos'
import type { Categoria } from '@/types/inventario'

interface ErroresCampos {
  codigo?: string
  nombre?: string
  categoria_id?: string
  ubicacion?: string
  stock_actual?: string
  stock_minimo?: string
}

interface FormularioProductoProps {
  categorias: Categoria[]
}

export default function FormularioProducto({ categorias }: FormularioProductoProps) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [errores, setErrores] = useState<ErroresCampos>({})

  const [categoriasLocales, setCategoriasLocales] = useState<Categoria[]>(categorias)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
  const [avisoCategoria, setAvisoCategoria] = useState<string | null>(null)

  const [campos, setCampos] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    stock_actual: '',
    stock_minimo: '',
    ubicacion: '',
  })

  useEffect(() => {
    if (!campos.categoria_id) {
      setCampos((prev) => ({ ...prev, codigo: '' }))
      return
    }
    const cat = categoriasLocales.find((c) => c.id === campos.categoria_id)
    if (!cat) return
    const prefijo = prefijoCategoria(cat.nombre)
    const supabase = crearClienteNavegador()
    let activo = true
    supabase
      .from('productos')
      .select('codigo')
      .eq('tipo_control', 'cantidad')
      .like('codigo', `${prefijo}-%`)
      .order('codigo', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!activo) return
        const ultimo = data?.[0]?.codigo as string | undefined
        const m = ultimo?.match(new RegExp(`^${prefijo}-(\\d+)$`))
        const siguiente = m ? parseInt(m[1], 10) + 1 : 1
        setCampos((prev) => ({
          ...prev,
          codigo: `${prefijo}-${String(siguiente).padStart(3, '0')}`,
        }))
      })
    return () => {
      activo = false
    }
  }, [campos.categoria_id, categoriasLocales])

  function actualizarCampo(campo: keyof typeof campos, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo as keyof ErroresCampos]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }))
    }
  }

  function validar(): boolean {
    const nuevosErrores: ErroresCampos = {}
    if (!campos.codigo.trim()) nuevosErrores.codigo = 'Selecciona una categoría para generar el código.'
    if (!campos.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.'
    if (!campos.categoria_id) nuevosErrores.categoria_id = 'Selecciona una categoría.'
    if (!campos.ubicacion.trim()) nuevosErrores.ubicacion = 'La ubicación física es obligatoria.'

    const stockActual = Number(campos.stock_actual)
    if (campos.stock_actual === '' || isNaN(stockActual) || stockActual < 0) {
      nuevosErrores.stock_actual = 'Debe ser un número igual o mayor a 0.'
    }
    const stockMinimo = Number(campos.stock_minimo)
    if (campos.stock_minimo === '' || isNaN(stockMinimo) || stockMinimo < 0) {
      nuevosErrores.stock_minimo = 'Debe ser un número igual o mayor a 0.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorGeneral(null)
    if (!validar()) return
    setCargando(true)
    try {
      const supabase = crearClienteNavegador()
      const { error } = await supabase.from('productos').insert({
        codigo: campos.codigo.trim(),
        nombre: campos.nombre.trim(),
        descripcion: campos.descripcion.trim() || null,
        categoria_id: campos.categoria_id,
        tipo_control: 'cantidad',
        stock_actual: Number(campos.stock_actual),
        stock_minimo: Number(campos.stock_minimo),
        ubicacion: campos.ubicacion.trim(),
        unidad_medida: null,
        activo: true,
      })
      if (error) {
        setErrorGeneral(error.message)
        setCargando(false)
        return
      }
      router.push('/inventario')
      router.refresh()
    } catch {
      setErrorGeneral('Error inesperado al guardar el producto.')
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4" noValidate>
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1">
            <Select
              id="categoria_id"
              label="Categoría"
              opciones={categoriasLocales.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
              placeholder="Selecciona una categoría"
              value={campos.categoria_id}
              onChange={(e) => actualizarCampo('categoria_id', e.target.value)}
              error={errores.categoria_id}
              required
            />
          </div>
          <button
            type="button"
            onClick={() => setModalCategoriasAbierto(true)}
            className="text-xs text-primario hover:underline mb-2 whitespace-nowrap"
          >
            ⚙ Administrar
          </button>
        </div>

        {avisoCategoria && (
          <p className="text-xs text-exito bg-green-50 border border-green-200 rounded px-3 py-2">
            {avisoCategoria}
          </p>
        )}
      </div>

      <Input
        id="codigo"
        label="Código del producto"
        placeholder="Se genera al elegir categoría"
        value={campos.codigo}
        onChange={() => {}}
        error={errores.codigo}
        ayuda="Se genera automáticamente según la categoría."
        readOnly
        required
      />

      <Input
        id="nombre"
        label="Nombre del producto"
        placeholder="Ej: Guantes, botas, gafas"
        value={campos.nombre}
        onChange={(e) => actualizarCampo('nombre', e.target.value)}
        error={errores.nombre}
        required
      />

      <Input
        id="descripcion"
        label="Descripción (opcional)"
        placeholder="Detalles adicionales del producto"
        value={campos.descripcion}
        onChange={(e) => actualizarCampo('descripcion', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="stock_actual"
          label="Cantidad actual"
          type="number"
          min="0"
          placeholder="0"
          value={campos.stock_actual}
          onChange={(e) => actualizarCampo('stock_actual', e.target.value)}
          error={errores.stock_actual}
          ayuda="¿Cuántas hay hoy?"
          required
        />
        <Input
          id="stock_minimo"
          label="Cantidad mínima"
          type="number"
          min="0"
          placeholder="5"
          value={campos.stock_minimo}
          onChange={(e) => actualizarCampo('stock_minimo', e.target.value)}
          error={errores.stock_minimo}
          ayuda="¿A partir de cuántas alertar?"
          required
        />
      </div>

      <Input
        id="ubicacion"
        label="Ubicación física"
        placeholder="Ej: Bodega principal, Oficina SST"
        value={campos.ubicacion}
        onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
        error={errores.ubicacion}
        required
      />

      {errorGeneral && <MensajeError mensaje={errorGeneral} />}

      <div className="flex gap-3 pt-2 border-t border-borde">
        <Boton type="submit" variante="primario" cargando={cargando}>
          Guardar producto
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => router.push('/inventario')}
          disabled={cargando}
        >
          Cancelar
        </Boton>
      </div>

      <ModalCategorias
        abierto={modalCategoriasAbierto}
        onCerrar={() => setModalCategoriasAbierto(false)}
        categorias={categoriasLocales}
        onCambio={(nuevas) => {
          setCategoriasLocales(nuevas)
          if (campos.categoria_id && !nuevas.some((c) => c.id === campos.categoria_id)) {
            setCampos((prev) => ({ ...prev, categoria_id: '', codigo: '' }))
          }
        }}
      />
    </form>
  )
}