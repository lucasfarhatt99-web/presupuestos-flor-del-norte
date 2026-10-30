// Interpreta un mensaje de WhatsApp y lo convierte en lineas de presupuesto.
// Funciona por reglas: alias de cada familia mas los apodos que la app aprende de las correcciones.
import { PRODUCTOS, ALIAS_FAMILIA, SABORES_ALMOHADAS } from '../data/catalogo.js'

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
  // "caja de 36 bolsas": es el contenido de la caja, no un item nuevo
  if (/^cajas?$/.test(palabras[i - 2] ?? '') && /^(de|con|por)$/.test(palabras[i - 1] ?? '')) return false
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

// "caja x 40 bolsas", "caja de 40 bolsas", "caja con 40 u": describe lo que trae la caja, no es la cantidad pedida
const CONTENIDO_CAJA = /\bcajas?\s*(?:x|de|con|por)\s*(\d+)\s*(?:bolsas?|bolsitas?|paquetes?|unidades?|u\b|un\b)/

export const leerContenidoCaja = (fragmento) => {
  const m = fragmento.match(CONTENIDO_CAJA)
  return m ? Number(m[1]) : null
}

const sinContenidoCaja = (fragmento) => fragmento.replace(new RegExp(CONTENIDO_CAJA, 'g'), ' ').replace(/\s+/g, ' ').trim()

// Orden de prioridad: el numero con que arranca el item ("1 caja ..."), despues el "x 3" ("almohadas x 3"),
// despues el primer numero suelto. Nunca el contenido de la caja ni una presentacion (80 g, 5 kg).
const leerCantidad = (fragmentoOriginal) => {
  if (/media docena/.test(fragmentoOriginal)) return 6
  const fragmento = sinContenidoCaja(fragmentoOriginal)
  const primera = fragmento.split(' ')[0]
  if (ES_NUMERO.test(primera) && !UNIDADES_PESO.test(fragmento.split(' ')[1] ?? '')) return Number(primera.replace(',', '.'))
  if (NUMEROS[primera] && UNIDADES_PEDIDO.test(fragmento.split(' ')[1] ?? '')) return NUMEROS[primera]
  const conX = fragmento.match(/(?:^|\s)x\s*(\d+)/)
  if (conX) return Number(conX[1])
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

const unidadDePalabra = (palabra = '') => {
  if (/^caja/.test(palabra)) return 'caja'
  if (/^(bolsa|bolsita|bolson|paquete|unidad)/.test(palabra)) return 'bolsa'
  return null
}

// La unidad que acompaña a la cantidad manda ("1 caja ..."); si no, la primera que aparezca.
// El contenido de la caja ("x 40 bolsas") no cuenta.
const leerUnidad = (fragmentoOriginal) => {
  const palabras = sinContenidoCaja(fragmentoOriginal).split(' ')
  const pegada = unidadDePalabra(palabras[1])
  if (pegada && (ES_NUMERO.test(palabras[0]) || NUMEROS[palabras[0]])) return pegada
  for (const p of palabras) if (unidadDePalabra(p)) return unidadDePalabra(p)
  return null
}

// Sabores de las almohadas en paquete (en granel cada sabor es un producto aparte)
const leerSabor = (fragmento) =>
  SABORES_ALMOHADAS.find((s) => fragmento.includes(normalizar(s))) ?? null

// Gana el alias mas largo encontrado ("copos de maiz" es copos, no maiz)
// Formas libres de nombrar una familia que no entran como alias fijo.
// "Tutucas" es como le dicen al maiz inflado: tutuca, tutuka, tutuquitas, tutucitas, tutcas, tutu, tucas...
const PATRONES_FAMILIA = {
  maiz: /(?:^|\s)(tut[uo]?(?:c|k|qu)\w*|tutus?|tucas?)(?=\s|$)/,
}

const detectarFamilia = (fragmento) => {
  const palabras = fragmento.split(' ').map(singular).join(' ')
  // largo 6 = como el alias "tutuca": gana a "maiz" y pierde contra alias mas especificos
  let mejor = null
  for (const [familia, patron] of Object.entries(PATRONES_FAMILIA)) {
    if (patron.test(fragmento)) mejor = { familia, largo: 6 }
  }
  for (const [familia, alias] of Object.entries(ALIAS_FAMILIA)) {
    for (const a of alias) {
      const encontrado = palabras.includes(singular(a)) || fragmento.includes(a)
      if (encontrado && (!mejor || a.length > mejor.largo)) mejor = { familia, largo: a.length }
    }
  }
  return mejor?.familia ?? null
}

// Puntua cada producto de la familia segun presentacion y palabras clave del fragmento.
// Si piden caja, el granel (que se vende por bolsa) queda descartado salvo que el gramaje o una clave lo nombren.
const elegirProducto = (familia, fragmento, gramos, unidadPedida) => {
  const candidatos = PRODUCTOS.filter((p) => p.familia === familia)
  const puntuados = candidatos.map((p) => {
    let puntos = 0
    const mismoGramaje = gramos && gramosDe(p.presentacion) === gramos
    const conClave = (p.claves ?? []).some((clave) => fragmento.includes(clave))
    if (mismoGramaje) puntos += 10
    if (conClave) puntos += 8
    if (/granel|kilo|kg/.test(fragmento) && p.tipo === 'granel') puntos += 3
    if (unidadPedida === 'caja' && p.tipo === 'granel' && !mismoGramaje && !(conClave && /caja/.test(p.nombre.toLowerCase()))) puntos -= 20
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
  const previo = fragmento.slice(0, inicio).trim()
  const saludo = inicio > 0 && previo.length > 1 && !detectarFamilia(previo)
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

// Un apodo aprendido no vale si el mensaje lo contradice: otro gramaje escrito, o caja para un producto de granel
const apodoContradicho = (producto, fragmento, gramos, unidadPedida) =>
  (gramos && gramosDe(producto.presentacion) !== gramos) || (unidadPedida === 'caja' && producto.tipo === 'granel')

// Controles comunes a toda linea con producto: sabor de almohadas en paquete y contenido de caja vs catalogo
const completarLinea = (linea, producto, fragmento) => {
  const motivos = linea.motivo ? [linea.motivo] : []
  let estado = linea.estado
  const sabor = producto.familia === 'almohadas' && producto.tipo === 'paquete' ? leerSabor(fragmento) : null
  const contenido = leerContenidoCaja(fragmento)
  if (contenido && producto.tipo === 'paquete' && contenido !== producto.bolsasPorCaja) {
    estado = 'duda'
    motivos.push(`el mensaje dice caja x ${contenido} y en catálogo es x ${producto.bolsasPorCaja}`)
  }
  return { ...linea, estado, sabor, motivo: motivos.join(', ') }
}

// apodos: { "palito salado": { productoId, unidad } } aprendidos de correcciones anteriores
export function interpretarMensaje(texto, apodos = {}) {
  const lineas = []
  for (const fragmento of fragmentar(texto)) {
    const cantidad = leerCantidad(fragmento)
    const unidadPedida = leerUnidad(fragmento)
    const gramos = leerPresentacion(fragmento)
    const aprendido = buscarApodo(fragmento, apodos)
    const productoAprendido = aprendido && PRODUCTOS.find((p) => p.id === aprendido.productoId)
    if (productoAprendido && !apodoContradicho(productoAprendido, fragmento, gramos, unidadPedida)) {
      const producto = productoAprendido
      const unidad = producto.tipo === 'granel' ? 'bolsa' : unidadPedida ?? aprendido.unidad ?? 'caja'
      lineas.push(completarLinea({
        original: textoPedido(fragmento),
        estado: cantidad ? 'ok' : 'duda',
        aprendido: aprendido.apodo,
        cantidad: cantidad ?? 1,
        productoId: producto.id,
        unidad,
        alternativas: PRODUCTOS.filter((p) => p.familia === producto.familia).map((p) => p.id),
        motivo: cantidad ? '' : 'cantidad no indicada',
      }, producto, fragmento))
      continue
    }
    const familia = detectarFamilia(fragmento)
    if (!familia) {
      if (cantidad && pareceItem(fragmento)) lineas.push({ original: textoPedido(fragmento), estado: 'no', cantidad, productoId: null, unidad: 'bolsa', alternativas: [] })
      continue
    }
    const { producto, seguro, alternativas } = elegirProducto(familia, fragmento, gramos, unidadPedida)
    const unidad = producto.tipo === 'granel' ? 'bolsa' : unidadPedida ?? 'caja'
    lineas.push(completarLinea({
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
    }, producto, fragmento))
  }
  return lineas
}
