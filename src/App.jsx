import { useState } from 'react'
import NuevoPresupuesto from './components/NuevoPresupuesto.jsx'
import Historial from './components/Historial.jsx'
import Catalogo from './components/Catalogo.jsx'
import Empresa from './components/Empresa.jsx'
import Apodos from './components/Apodos.jsx'
import { interpretarMensaje, MENSAJE_EJEMPLO } from './lib/interpretar.js'
import { aprenderDe } from './lib/aprender.js'
import {
  leerEmpresa, guardarEmpresa, leerPresupuestos, guardarPresupuestos, leerApodos, guardarApodos, siguienteNumero,
} from './lib/almacen.js'

const SECCIONES = [
  ['nuevo', 'Nuevo presupuesto'],
  ['historial', 'Presupuestos'],
  ['catalogo', 'Catálogo y precios'],
  ['apodos', 'Apodos'],
  ['empresa', 'Datos de la empresa'],
]

const presupuestoVacio = (numero) => ({
  numero,
  creado: new Date().toISOString(),
  estado: 'Pendiente',
  lista: 'mayorista',
  descuentoPct: 0,
  cliente: { nombre: '', cuit: '', telefono: '' },
  lineas: [],
  observaciones: '',
  mensajeOriginal: '',
})

// ?ejemplo abre la app con el pedido de muestra ya interpretado
const presupuestoInicial = () => {
  const base = presupuestoVacio(siguienteNumero(leerPresupuestos()))
  if (!new URLSearchParams(location.search).has('ejemplo')) return base
  return {
    ...base,
    mensajeOriginal: MENSAJE_EJEMPLO,
    lineas: interpretarMensaje(MENSAJE_EJEMPLO, leerApodos()),
    cliente: { ...base.cliente, nombre: 'Cliente de ejemplo' },
  }
}

export default function App() {
  const [seccion, setSeccion] = useState('nuevo')
  const [empresa, setEmpresa] = useState(leerEmpresa)
  const [presupuestos, setPresupuestos] = useState(leerPresupuestos)
  const [actual, setActual] = useState(presupuestoInicial)
  const [apodos, setApodos] = useState(leerApodos)
  const [aviso, setAviso] = useState('')

  const persistir = (lista) => {
    setPresupuestos(lista)
    guardarPresupuestos(lista)
  }

  const cambiarApodos = (nuevos) => {
    setApodos(nuevos)
    guardarApodos(nuevos)
  }

  const avisar = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 3000)
  }

  const guardar = () => {
    // Guardar confirma las correcciones: de ahi se aprenden los apodos
    const aprendizaje = aprenderDe(actual.lineas, apodos)
    if (aprendizaje.cambios) cambiarApodos(aprendizaje.apodos)
    const guardado = { ...actual, lineas: actual.lineas.map((l) => ({ ...l, corregido: false })) }
    setActual(guardado)
    const existe = presupuestos.some((p) => p.numero === guardado.numero)
    persistir(existe ? presupuestos.map((p) => (p.numero === guardado.numero ? guardado : p)) : [...presupuestos, guardado])
    const extra = aprendizaje.cambios ? ` · ${aprendizaje.cambios === 1 ? '1 apodo aprendido' : `${aprendizaje.cambios} apodos aprendidos`}` : ''
    avisar(`Presupuesto N° ${guardado.numero} guardado${extra}`)
  }

  const irA = (id) => {
    // "Nuevo presupuesto" desde otra seccion arranca uno en blanco
    if (id === 'nuevo' && seccion !== 'nuevo') setActual(presupuestoVacio(siguienteNumero(presupuestos)))
    setSeccion(id)
  }

  return (
    <div className="app">
      <header className="barra no-imprimir">
        <img src="/logo-crop.png" alt="Flor del Norte" className="barra-logo" />
        <nav>
          {SECCIONES.map(([id, nombre]) => (
            <button key={id} className={seccion === id ? 'activo' : ''} onClick={() => irA(id)}>{nombre}</button>
          ))}
        </nav>
        <span className="usuario">Admin</span>
      </header>

      {aviso && <div className="toast no-imprimir">{aviso}</div>}

      <main>
        {seccion === 'nuevo' && (
          <NuevoPresupuesto key={actual.numero} presupuesto={actual} onCambiar={setActual} onGuardar={guardar} empresa={empresa} apodos={apodos} />
        )}
        {seccion === 'historial' && (
          <Historial
            presupuestos={presupuestos}
            empresa={empresa}
            onAbrir={(p) => { setActual(p); setSeccion('nuevo') }}
            onCambiarEstado={(numero, estado) => persistir(presupuestos.map((p) => (p.numero === numero ? { ...p, estado } : p)))}
          />
        )}
        {seccion === 'catalogo' && <Catalogo />}
        {seccion === 'apodos' && <Apodos apodos={apodos} onCambiar={cambiarApodos} />}
        {seccion === 'empresa' && <Empresa empresa={empresa} onCambiar={(e) => { setEmpresa(e); guardarEmpresa(e) }} />}
      </main>
    </div>
  )
}
