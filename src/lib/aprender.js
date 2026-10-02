import { extraerApodo } from './interpretar.js'

// Toma las lineas que el usuario corrigio a mano y guarda "como lo escribio el cliente" -> producto.
// Devuelve los apodos actualizados y cuantos se agregaron o cambiaron.
export function aprenderDe(lineas, apodos) {
  const nuevos = { ...apodos }
  let cambios = 0
  for (const l of lineas) {
    if (!l.corregido || !l.original || !l.productoId) continue
    const apodo = extraerApodo(l.original)
    if (apodo.length < 3) continue
    const previo = nuevos[apodo]
    if (previo?.productoId === l.productoId && previo?.unidad === l.unidad) continue
    nuevos[apodo] = { productoId: l.productoId, unidad: l.unidad, ejemplo: l.original, aprendido: new Date().toISOString() }
    cambios++
  }
  return { apodos: nuevos, cambios }
}
