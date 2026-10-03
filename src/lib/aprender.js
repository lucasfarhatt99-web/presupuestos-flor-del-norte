import { extraerApodo } from './interpretar.js'

// Toma las lineas que el usuario corrigio a mano y arma "como lo escribio el cliente" -> producto.
// Devuelve solo los apodos nuevos o cambiados: [[apodo, { productoId, unidad, ejemplo, aprendido }], ...]
export function aprenderDe(lineas, apodos) {
  const cambios = new Map()
  for (const l of lineas) {
    if (!l.corregido || !l.original || !l.productoId) continue
    const apodo = extraerApodo(l.original)
    if (apodo.length < 3) continue
    const previo = apodos[apodo]
    if (previo?.productoId === l.productoId && previo?.unidad === l.unidad) continue
    cambios.set(apodo, { productoId: l.productoId, unidad: l.unidad, ejemplo: l.original, aprendido: new Date().toISOString() })
  }
  return [...cambios]
}
