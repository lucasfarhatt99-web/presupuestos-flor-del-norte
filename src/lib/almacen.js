// Persistencia local del bosquejo. En la version online esto pasa a Supabase.
const CLAVES = { empresa: 'fdn.empresa', presupuestos: 'fdn.presupuestos' }

const leer = (clave, defecto) => {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : defecto
  } catch {
    return defecto
  }
}

const guardar = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // sin almacenamiento disponible: se sigue trabajando en memoria
  }
}

export const EMPRESA_POR_DEFECTO = {
  razonSocial: 'Flor del Norte',
  cuit: '[completar CUIT]',
  condicionIva: '[completar condición IVA]',
  direccion: '[completar dirección]',
  telefono: '[completar teléfono]',
  email: '[completar email]',
  puntoVenta: 1,
  validezDias: 7,
  leyendaIva: '[completar: precios con IVA incluido / más IVA]',
  condiciones: 'Precios expresados en pesos argentinos. Sujetos a modificación sin previo aviso una vez vencida la validez del presupuesto.',
}

export const leerEmpresa = () => ({ ...EMPRESA_POR_DEFECTO, ...leer(CLAVES.empresa, {}) })
export const guardarEmpresa = (empresa) => guardar(CLAVES.empresa, empresa)

export const leerPresupuestos = () => leer(CLAVES.presupuestos, [])
export const guardarPresupuestos = (lista) => guardar(CLAVES.presupuestos, lista)

export const siguienteNumero = (presupuestos) =>
  presupuestos.reduce((max, p) => Math.max(max, p.numero), 0) + 1
