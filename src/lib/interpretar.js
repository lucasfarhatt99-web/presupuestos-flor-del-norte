// Interpreta un mensaje de WhatsApp y lo convierte en lineas de presupuesto.
// Version local basada en reglas. La lectura de prints (imagenes) se suma con IA en la fase siguiente.
import { PRODUCTOS, ALIAS_FAMILIA } from '../data/catalogo.js'

export const MENSAJE_EJEMPLO = 'Hola! me pasás precio por un mix de 4 almohaditas, 20 tutucas y 15 tostadas de arroz? Gracias'

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30, cuarenta: 40,
  cincuenta: 50, cien: 100, docena: 12,
}

export const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s,.;/x-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const singular = (palabra) => palabra.replace(/(es|s)$/, '')

// Divide el mensaje en fragmentos que probablemente contienen un producto cada uno
const fragmentar = (texto) =>
  texto
    .split(/\n/)
    .flatMap((linea) => normalizar(linea).split(/,|;|\by\b|\+/))
    .map((f) => f.trim())
    .filter(Boolean)

const leerCantidad = (fragmento) => {
  const media = /media docena/.test(fragmento)
  if (media) return 6
  const conX = fragmento.match(/x\s*(\d+)/)
  if (conX) return Number(conX[1])
  // Primer numero que no sea parte de una presentacion (80 g, 5 kg)
  const numeros = [...fragmento.matchAll(/(\d+(?:[.,]\d+)?)(\s*(?:g|gr|grs|kg|kilo|kilos)\b)?/g)]
  const suelto = numeros.find((m) => !m[2])
  if (suelto) return Number(suelto[1].replace(',', '.'))
  const palabra = fragmento.split(' ').find((p) => NUMEROS[p])
  return palabra ? NUMEROS[palabra] : null
}

const leerPresentacion = (fragmento) => {
  const m = fragmento.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|grs|kg|kilo|kilos)\b/)
  if (!m) return null
  const valor = Number(m[1].replace(',', '.'))
  return m[2].startsWith('k') ? valor * 1000 : valor
}

const gramosDe = (presentacion) => {
  const m = normalizar(presentacion).match(/(\d+(?:[.,]\d+)?)\s*(g|kg)/)
  if (!m) return null
  const valor = Number(m[1].replace(',', '.'))
  return m[2] === 'kg' ? valor * 1000 : valor
}

const leerUnidad = (fragmento) => {
  if (/\bcaja/.test(fragmento)) return 'caja'
  if (/\b(bolsa|bolsita|bolson|paquete|unidad)/.test(fragmento)) return 'bolsa'
  return null
}

// Gana el alias mas largo encontrado ("copos de maiz" es copos, no maiz)
const detectarFamilia = (fragmento) => {
  const palabras = fragmento.split(' ').map(singular).join(' ')
  let mejor = null
  for (const [familia, alias] of Object.entries(ALIAS_FAMILIA)) {
    for (const a of alias) {
      const encontrado = palabras.includes(singular(a)) || fragmento.includes(a)
      if (encontrado && (!mejor || a.length > mejor.largo)) mejor = { familia, largo: a.length }
    }
  }
  return mejor?.familia ?? null
}

// Puntua cada producto de la familia segun presentacion y palabras clave del fragmento
const elegirProducto = (familia, fragmento, gramos) => {
  const candidatos = PRODUCTOS.filter((p) => p.familia === familia)
  const puntuados = candidatos.map((p) => {
    let puntos = 0
    if (gramos && gramosDe(p.presentacion) === gramos) puntos += 10
    for (const clave of p.claves ?? []) if (fragmento.includes(clave)) puntos += 8
    if (/granel|kilo|kg/.test(fragmento) && p.tipo === 'granel') puntos += 3
    if (p.porDefecto) puntos += 1
    return { p, puntos }
  })
  puntuados.sort((a, b) => b.puntos - a.puntos)
  const mejor = puntuados[0]
  // Seguro solo si algo del mensaje (presentacion o clave) identifico el producto
  const seguro = mejor.puntos >= 8
  return { producto: mejor.p, seguro, alternativas: candidatos.map((c) => c.id) }
}

// Para mostrar: saca saludos antes de la cantidad y despedidas al final
const textoPedido = (fragmento) => {
  const inicio = fragmento.search(/\d/)
  return (inicio > 0 ? fragmento.slice(inicio) : fragmento).replace(/\b(gracias|saludos|abrazo)\b.*$/, '').trim()
}

export function interpretarMensaje(texto) {
  const lineas = []
  for (const fragmento of fragmentar(texto)) {
    const familia = detectarFamilia(fragmento)
    const cantidad = leerCantidad(fragmento)
    if (!familia) {
      // Solo se reporta como "no encontrado" si parece un pedido (tiene cantidad)
      if (cantidad) lineas.push({ original: textoPedido(fragmento), estado: 'no', cantidad, productoId: null, unidad: 'bolsa', alternativas: [] })
      continue
    }
    const { producto, seguro, alternativas } = elegirProducto(familia, fragmento, leerPresentacion(fragmento))
    const unidadPedida = leerUnidad(fragmento)
    const unidad = producto.tipo === 'granel' ? 'bolsa' : unidadPedida ?? 'caja'
    lineas.push({
      original: textoPedido(fragmento),
      estado: seguro && cantidad && (producto.tipo === 'granel' || unidadPedida) ? 'ok' : 'duda',
      cantidad: cantidad ?? 1,
      productoId: producto.id,
      unidad,
      alternativas,
      motivo: [
        !seguro && 'presentación no indicada',
        !cantidad && 'cantidad no indicada',
        !unidadPedida && producto.tipo === 'paquete' && 'se asumió caja',
      ].filter(Boolean).join(', '),
    })
  }
  return lineas
}
