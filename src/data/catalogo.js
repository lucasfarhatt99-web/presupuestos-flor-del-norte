// Fuente: "LPD OCTUBRE 26' - PREMIUM.pdf", "- MAYORISTA.pdf" y "- TRADE.pdf"
// Se carga solo el precio por bolsa, en el orden de LISTAS: [premium, mayorista, trade].
// La caja es siempre bolsa x bolsas por caja: los precios de caja de las listas impresas estan redondeados y no se usan.

export const VIGENCIA_LISTAS = 'Octubre 2026'

// Ordenadas de mayor a menor volumen (y de menor a mayor precio)
export const LISTAS = {
  premium: { id: 'premium', nombre: 'Lista Premium' },
  mayorista: { id: 'mayorista', nombre: 'Lista Mayorista' },
  trade: { id: 'trade', nombre: 'Lista Trade' },
}

const IDS_LISTAS = Object.keys(LISTAS)

// familia: agrupa productos para interpretar mensajes ("tutucas" -> maiz)
// precios: un precio por bolsa por lista; la caja se calcula
const paquete = (id, nombre, familia, presentacion, bolsasPorCaja, bultosPorPalet, precios, extra = {}) => ({
  id, nombre, familia, presentacion, tipo: 'paquete', bolsasPorCaja, bultosPorPalet,
  precios: Object.fromEntries(IDS_LISTAS.map((lista, i) => [lista, { bolsa: precios[i], caja: precios[i] * bolsasPorCaja }])),
  ...extra,
})

// precios: un precio por bolsa por lista
const granel = (id, nombre, familia, presentacion, bolsasPorPalet, precios, extra = {}) => ({
  id, nombre, familia, presentacion, tipo: 'granel', bolsasPorPalet,
  precios: Object.fromEntries(IDS_LISTAS.map((lista, i) => [lista, { bolsa: precios[i] }])),
  ...extra,
})

export const PRODUCTOS = [
  paquete('mi-sd-80', 'Maíz Inflado Super Dulce', 'maiz', '80 g', 36, 50, [540, 621, 729], { porDefecto: true }),
  paquete('mi-sd-30', 'Maíz Inflado Super Dulce', 'maiz', '30 g', 24, 150, [273, 314, 369]),
  paquete('mi-sd-cap-8', 'Maíz Inflado Super Dulce Capibara', 'maiz', '8 g', 100, 150, [55, 63, 74], { claves: ['capibara'] }),
  paquete('mi-st-80', 'Maíz Inflado con Stevia', 'maiz', '80 g', 36, 50, [624, 718, 842], { claves: ['stevia'] }),
  paquete('av-inst-400', 'Avena Instantánea', 'avena', '400 g', 12, 150, [1089, 1307, 1470], { porDefecto: true }),
  paquete('copos-20', 'Copos de Maíz', 'copos', '20 g', 300, 30, [211, 221, 261], { porDefecto: true }),
  paquete('trigo-sd-50', 'Trigo Inflado Super Dulce', 'trigo', '50 g', 24, 50, [563, 647, 760], { porDefecto: true }),
  paquete('tost-120', 'Tostadas de Arroz', 'tostadas', '120 g', 18, 50, [792, 911, 1069], { porDefecto: true }),
  paquete('alm-180', 'Almohadas', 'almohadas', '180 g', 40, 50, [1329, 1462, 1728], { porDefecto: true }),
  paquete('alm-50', 'Almohadas', 'almohadas', '50 g', 36, 150, [494, 543, 642]),

  granel('mi-sd-5k', 'Maíz Inflado Super Dulce', 'maiz', '5 kg', 50, [16000, 18500, 21500]),
  granel('mi-sd-1k', 'Maíz Inflado Super Dulce', 'maiz', '1 kg', 150, [3200, 3700, 4300]),
  granel('mi-st-5k', 'Maíz Inflado con Stevia', 'maiz', '5 kg', 50, [16500, 19000, 22500], { claves: ['stevia'] }),
  granel('mi-st-1k', 'Maíz Inflado con Stevia', 'maiz', '1 kg', 150, [3300, 3800, 4500], { claves: ['stevia'] }),
  granel('av-inst-30k', 'Avena Instantánea', 'avena', '30 kg', 25, [49100, 58900, 66300]),
  granel('copos-3500', 'Copos de Maíz', 'copos', '3,5 kg', 150, [15050, 16450, 19600]),
  granel('trigo-sd-5k', 'Trigo Inflado Super Dulce', 'trigo', '5 kg', 50, [18000, 20500, 24500]),
  granel('trigo-sd-1k', 'Trigo Inflado Super Dulce', 'trigo', '1 kg', 150, [3600, 4100, 4900]),
  granel('tost-500', 'Tostadas de Arroz', 'tostadas', '500 g', 200, [2400, 2800, 3200]),
  granel('tost-caja-2500', 'Caja de Tostadas de Arroz', 'tostadas', '2,5 kg', 50, [12000, 14000, 16000], { claves: ['caja de tostadas'] }),
  granel('chiz-5k', 'Bolsón Chizito Bajonazo', 'chizito', '5 kg', 24, [23000, 25500, 30000], { claves: ['bolson'] }),
  granel('chiz-1k', 'Chizito Bajonazo', 'chizito', '1 kg', 120, [4600, 5100, 6000], { porDefecto: true }),
  granel('alm-fru-1k', 'Almohadas Frutilla', 'almohadas', '1 kg', 400, [4600, 5100, 6000], { claves: ['frutilla'] }),
  granel('alm-lim-1k', 'Almohadas Limón', 'almohadas', '1 kg', 400, [4600, 5100, 6000], { claves: ['limon'] }),
  granel('alm-man-1k', 'Almohadas Maní', 'almohadas', '1 kg', 400, [5000, 5500, 6500], { claves: ['mani'] }),
  granel('alm-ave-1k', 'Almohadas Avellana', 'almohadas', '1 kg', 400, [5000, 5500, 6500], { claves: ['avellana'] }),
  granel('alm-cho-1k', 'Almohadas Chocolate', 'almohadas', '1 kg', 400, [5800, 6400, 7500], { claves: ['chocolate'] }),
]

export const SABORES_ALMOHADAS = ['Chocolate', 'Frutilla', 'Avellana', 'Maní', 'Limón']

// Volumen al que aplica cada lista (por familia)
export const CONDICIONES = {
  premium: {
    chizito: 'Mayor a 500 kg',
    maiz: 'Mayor a 1000 kg',
    avena: 'Mayor a 500 kg',
    trigo: 'Mayor a 500 kg',
    almohadas: 'Mayor a 400 kg',
    tostadas: 'Mayor a 100 kg',
  },
  mayorista: {
    chizito: 'Entre 120 y 500 kg',
    maiz: 'Entre 200 y 1000 kg',
    avena: 'Hasta 500 kg',
    trigo: 'Hasta 500 kg',
    almohadas: 'Entre 200 y 400 kg',
    tostadas: 'Hasta 100 kg',
  },
  trade: {
    chizito: 'Hasta 120 kg',
    maiz: 'Hasta 200 kg',
    avena: 'Hasta 100 kg',
    trigo: 'Hasta 100 kg',
    almohadas: 'Hasta 200 kg',
    tostadas: 'Hasta 50 kg',
  },
}

export const FAMILIAS = {
  maiz: 'Maíz Inflado',
  avena: 'Avena',
  copos: 'Copos de Maíz',
  trigo: 'Trigo Inflado',
  tostadas: 'Tostadas de Arroz',
  chizito: 'Chizito',
  almohadas: 'Almohadas',
}

// Formas en que los clientes nombran cada familia en WhatsApp
export const ALIAS_FAMILIA = {
  maiz: ['tutuca', 'pochoclo', 'maiz inflado', 'maiz dulce', 'maiz'],
  avena: ['avena'],
  copos: ['copos', 'copito', 'cereal', 'corn flakes'],
  trigo: ['trigo', 'trigo inflado'],
  tostadas: ['tostada', 'tostadita', 'galleta de arroz', 'galletita de arroz'],
  chizito: ['chizito', 'chizitos', 'bajonazo', 'chisito'],
  almohadas: ['almohada', 'almohadita', 'almohadilla'],
}

export const productoPorId = (id) => PRODUCTOS.find((p) => p.id === id)

export const etiquetaProducto = (p) => `${p.nombre} ${p.presentacion}`

export const unidadesDe = (p) => (p.tipo === 'paquete' ? ['caja', 'bolsa'] : ['bolsa'])

export const precioDe = (p, lista, unidad) => p?.precios[lista]?.[unidad] ?? 0
