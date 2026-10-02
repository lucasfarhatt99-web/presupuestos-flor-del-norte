import { productoPorId, precioDe } from '../data/catalogo.js'

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const moneda = (valor) => pesos.format(Math.round(valor))

export const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const sumarDias = (iso, dias) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + dias)
  return d.toISOString()
}

// Sin numero = presupuesto todavia no guardado (la base asigna el numero al guardar)
export const numeroComprobante = (puntoVenta, numero) =>
  numero ? `${String(puntoVenta).padStart(4, '0')}-${String(numero).padStart(8, '0')}` : 'sin guardar'

export const plural = (unidad, cantidad) => (cantidad === 1 ? unidad : `${unidad}s`)

// Calcula importes de un presupuesto a partir de sus lineas
export function calcular(lineas, lista, descuentoPct) {
  const items = lineas
    .filter((l) => l.productoId)
    .map((l) => {
      const producto = productoPorId(l.productoId)
      const precio = precioDe(producto, lista, l.unidad)
      return { ...l, producto, precio, importe: precio * l.cantidad }
    })
  const subtotal = items.reduce((s, i) => s + i.importe, 0)
  const descuento = (subtotal * (Number(descuentoPct) || 0)) / 100
  return { items, subtotal, descuento, total: subtotal - descuento }
}
