// Interpreta un mensaje de WhatsApp y lo convierte en lineas de presupuesto.
// Funciona por reglas: alias de cada familia mas los apodos que la app aprende de las correcciones.
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

const singular = (palabra) => palabra.replace(/s$/, '')

// Divide el mensaje en fragmentos que probablemente contienen un producto cada uno
const UNIDADES_PEDIDO = /^(caja|bolsa|bolsita|bolson|bolsone|paquete|unidad|unidade|bulto|docena)s?$/
const UNIDADES_PESO = /^(g|gr|grs|gramo|gramos|kg|kgs|kilo|kilos)$/
const ES_NUMERO = /^\d+([.,]\d+)?$/

// Una palabra empieza un item nuevo si es una cantidad: "5 cajas", "15 paquetes", "3 almohadas".
// No cuenta si es una presentacion ("80 g", "1kg") ni el "x 3" de "almohadas x 3 cajas".
const empiezaItem = (palabras, i) => {
  const palabra = palabras[i]
  const siguiente = palabras[i + 1] ?? ''
  if (palabras[i - 1] === 'x' || UNIDADES_PESO.test(siguiente)) return false
  if (ES_NUMERO.test(palabra)) return true
  return Boolean(NUMEROS[palabra]) && UNIDADES_PEDIDO.test(siguiente)
}

// Corta una frase sin separadores en items, uno por cada cantidad que aparece
const separarPorCantidades = (frase) => {
  const palabras = frase.split(' ')
  const partes = []
  let actual = []
  palabras.forEach((palabra, i) => {
    if (actual.length && empiezaItem(palabras, i)) {
      partes.push(actual.join(' '))
      actual = []
    }
    actual.push(palabra)
  })
  if (actual.length) partes.push(actual.join(' '))
  return partes
}

// Separa por renglon, coma (no la decimal de "2,5 kg"), punto y coma, "y", "+" y por cada nueva cantidad.
// Asi funciona aunque al pegar se pierdan los saltos de linea.
const fragmentar = (texto) =>
  texto
    .split(/\n/)
    .flatMap((linea) => normalizar(linea).split(/(?<!\d),|,(?!\d)|;|\by\b|\+/))
    .flatMap((frase) => separarPorCantidades(frase.trim()))
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

// Lo que suele venir despues del ultimo producto: "avisame cuando lo tengas", "gracias", "abrazo"
const CIERRE = /(\.(?!\d)|\b(gracias|saludos|abrazo|avisame|avisa|aviso|quedo|espero|coordinamos|cuando lo|cuando tenga)\b).*$/

// Para mostrar y para aprender apodos: saca saludos antes de la cantidad y despedidas al final
const textoPedido = (fragmento) => {
  const inicio = fragmento.search(/\d/)
  const saludo = inicio > 0 && !detectarFamilia(fragmento.slice(0, inicio))
  return (saludo ? fragmento.slice(inicio) : fragmento).replace(CIERRE, '').trim()
}

// Sin producto reconocido, solo se muestra si parece un item ("7 alfajores", "dos cajas de ...").
// Evita lineas falsas como "hola me pasas precio por un mix de".
const pareceItem = (fragmento) =>
  /\d/.test(fragmento) || fragmento.split(' ').some((p) => UNIDADES_PEDIDO.test(p))

const PALABRAS_VACIAS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas', 'x', 'por', 'favor', 'mas', 'con',
  'caja', 'bolsa', 'bolsita', 'paquete', 'unidad', 'me', 'pasa', 'pasas', 'precio', 'quiero', 'necesito',
  'mandame', 'hola', 'buen', 'dia', 'gracias', 'docena', 'media', 'tambien', 'otro', 'otra', 'otros', 'otras',
  ...Object.keys(NUMEROS),
])

// "7 cajas de palitos salados" -> "palito salado". Es la clave con la que se guarda un apodo.
export const extraerApodo = (texto) =>
  normalizar(texto)
    .replace(/\d+(?:[.,]\d+)?\s*(?:g|gr|grs|kg|kilo|kilos)\b/g, ' ')
    .replace(/[\d,.;/-]+/g, ' ')
    .split(' ')
    .filter((p) => !PALABRAS_VACIAS.has(p))
    .map(singular)
    .filter((p) => p.length > 1 && !PALABRAS_VACIAS.has(p))
    .join(' ')

// Busca el apodo aprendido mas largo contenido en el fragmento
const buscarApodo = (fragmento, apodos) => {
  const texto = ` ${extraerApodo(fragmento)} `
  let mejor = null
  for (const [apodo, destino] of Object.entries(apodos)) {
    if (texto.includes(` ${apodo} `) && (!mejor || apodo.length > mejor.apodo.length)) mejor = { apodo, ...destino }
  }
  return mejor
}

// apodos: { "palito salado": { productoId, unidad } } aprendidos de correcciones anteriores
export function interpretarMensaje(texto, apodos = {}) {
  const lineas = []
  for (const fragmento of fragmentar(texto)) {
    const cantidad = leerCantidad(fragmento)
    const aprendido = buscarApodo(fragmento, apodos)
    const productoAprendido = aprendido && PRODUCTOS.find((p) => p.id === aprendido.productoId)
    if (productoAprendido) {
      const producto = productoAprendido
      const unidad = producto.tipo === 'granel' ? 'bolsa' : leerUnidad(fragmento) ?? aprendido.unidad ?? 'caja'
      lineas.push({
        original: textoPedido(fragmento),
        estado: cantidad ? 'ok' : 'duda',
        aprendido: aprendido.apodo,
        cantidad: cantidad ?? 1,
        productoId: producto.id,
        unidad,
        alternativas: PRODUCTOS.filter((p) => p.familia === producto.familia).map((p) => p.id),
        motivo: cantidad ? '' : 'cantidad no indicada',
      })
      continue
    }
    const familia = detectarFamilia(fragmento)
    if (!familia) {
      if (cantidad && pareceItem(fragmento)) lineas.push({ original: textoPedido(fragmento), estado: 'no', cantidad, productoId: null, unidad: 'bolsa', alternativas: [] })
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
