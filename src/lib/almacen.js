// Acceso a datos en Supabase. Los permisos (quien ve que) los aplica la base con RLS: ver supabase/schema.sql.
import { supabase } from './supabase.js'

// Los campos vacios no se muestran en el presupuesto
export const EMPRESA_POR_DEFECTO = {
  razonSocial: 'FLOR DEL NORTE SAS',
  cuit: '30-71691390-9',
  condicionIva: '',
  direccion: 'Américo Vespucio 218, Banda del Río Salí, Tucumán',
  email: '',
  puntoVenta: 1,
  validezDias: 7,
  leyendaIva: 'Precios unitarios y totales expresados sin IVA. Al facturar se adiciona el IVA correspondiente.',
  condiciones: 'Precios expresados en pesos argentinos. Sujetos a modificación sin previo aviso una vez vencida la validez del presupuesto.',
}

// Devuelve data o lanza el error de Supabase, para manejarlo en un solo lugar
const resultado = ({ data, error }) => {
  if (error) throw error
  return data
}

// ---------- Usuarios ----------

export const cargarPerfil = async (id) =>
  resultado(await supabase.from('perfiles').select('*').eq('id', id).maybeSingle())

export const cargarPerfiles = async () =>
  resultado(await supabase.from('perfiles').select('*').order('creado'))

export const actualizarPerfil = async (id, cambios) =>
  resultado(await supabase.from('perfiles').update(cambios).eq('id', id).select().single())

// ---------- Empresa ----------

export const cargarEmpresa = async () => {
  const fila = resultado(await supabase.from('empresa').select('datos').eq('id', 1).maybeSingle())
  return { ...EMPRESA_POR_DEFECTO, ...(fila?.datos ?? {}) }
}

export const guardarEmpresa = async (datos) =>
  resultado(await supabase.from('empresa').update({ datos, actualizado: new Date().toISOString() }).eq('id', 1))

// ---------- Presupuestos ----------

const desdeFila = (f) => ({
  numero: f.numero,
  creado: f.creado,
  estado: f.estado,
  lista: f.lista,
  descuentoPct: Number(f.descuento_pct),
  cliente: { nombre: '', cuit: '', telefono: '', ...f.cliente },
  lineas: f.lineas,
  observaciones: f.observaciones,
  mensajeOriginal: f.mensaje_original,
  total: Number(f.total),
  vendedorId: f.vendedor_id,
  vendedor: f.vendedor?.nombre || f.vendedor?.email || '',
})

const haciaFila = (p, total) => ({
  estado: p.estado,
  lista: p.lista,
  descuento_pct: Number(p.descuentoPct) || 0,
  cliente: p.cliente,
  lineas: p.lineas,
  observaciones: p.observaciones,
  mensaje_original: p.mensajeOriginal,
  total,
  actualizado: new Date().toISOString(),
})

const CAMPOS_PRESUPUESTO = '*, vendedor:perfiles(nombre, email)'

export const cargarPresupuestos = async () =>
  resultado(await supabase.from('presupuestos').select(CAMPOS_PRESUPUESTO).order('numero', { ascending: false })).map(desdeFila)

// Sin numero es nuevo: la base asigna el numero correlativo
export const guardarPresupuesto = async (p, total) => {
  const consulta = p.numero
    ? supabase.from('presupuestos').update(haciaFila(p, total)).eq('numero', p.numero)
    : supabase.from('presupuestos').insert(haciaFila(p, total))
  return desdeFila(resultado(await consulta.select(CAMPOS_PRESUPUESTO).single()))
}

export const cambiarEstadoPresupuesto = async (numero, estado) =>
  resultado(await supabase.from('presupuestos').update({ estado, actualizado: new Date().toISOString() }).eq('numero', numero))

// ---------- Apodos ----------

// { "palito salado": { productoId, unidad, ejemplo, aprendido } }
export const cargarApodos = async () => {
  const filas = resultado(await supabase.from('apodos').select('*'))
  return Object.fromEntries(filas.map((f) => [f.apodo, { productoId: f.producto_id, unidad: f.unidad, ejemplo: f.ejemplo, aprendido: f.aprendido }]))
}

// entradas: [[apodo, { productoId, unidad, ejemplo, aprendido }], ...]
export const guardarApodos = async (entradas) =>
  resultado(await supabase.from('apodos').upsert(
    entradas.map(([apodo, a]) => ({ apodo, producto_id: a.productoId, unidad: a.unidad, ejemplo: a.ejemplo, aprendido: a.aprendido })),
  ))

export const borrarApodo = async (apodo) =>
  resultado(await supabase.from('apodos').delete().eq('apodo', apodo))
