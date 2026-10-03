import { useCallback, useEffect, useState } from 'react'
import NuevoPresupuesto from './components/NuevoPresupuesto.jsx'
import Historial from './components/Historial.jsx'
import Catalogo from './components/Catalogo.jsx'
import Empresa from './components/Empresa.jsx'
import Apodos from './components/Apodos.jsx'
import Usuarios from './components/Usuarios.jsx'
import Ingreso from './components/Ingreso.jsx'
import { supabase } from './lib/supabase.js'
import { interpretarMensaje, MENSAJE_EJEMPLO } from './lib/interpretar.js'
import { aprenderDe } from './lib/aprender.js'
import { calcular } from './lib/formato.js'
import {
  cargarPerfil, cargarEmpresa, guardarEmpresa, cargarPresupuestos, guardarPresupuesto,
  cambiarEstadoPresupuesto, cargarApodos, guardarApodos, borrarApodo, EMPRESA_POR_DEFECTO,
} from './lib/almacen.js'

const SECCIONES = [
  ['nuevo', 'Nuevo presupuesto'],
  ['historial', 'Presupuestos'],
  ['catalogo', 'Catálogo y precios'],
  ['apodos', 'Apodos'],
  ['empresa', 'Datos de la empresa', 'admin'],
  ['usuarios', 'Usuarios', 'admin'],
]

// numero queda vacio hasta guardar; clave identifica el borrador en pantalla
const presupuestoVacio = () => ({
  clave: crypto.randomUUID(),
  numero: null,
  creado: new Date().toISOString(),
  estado: 'Pendiente',
  lista: 'mayorista',
  descuentoPct: 0,
  flete: 0,
  ivaPct: 0,
  cliente: { nombre: '', cuit: '', telefono: '' },
  lineas: [],
  observaciones: '',
  mensajeOriginal: '',
})

// ?ejemplo abre la app con el pedido de muestra ya interpretado
const presupuestoInicial = () => {
  const base = presupuestoVacio()
  if (!new URLSearchParams(location.search).has('ejemplo')) return base
  return {
    ...base,
    mensajeOriginal: MENSAJE_EJEMPLO,
    lineas: interpretarMensaje(MENSAJE_EJEMPLO),
    cliente: { ...base.cliente, nombre: 'Cliente de ejemplo' },
  }
}

const Cargando = ({ texto = 'Cargando...' }) => <div className="ingreso"><p className="nota">{texto}</p></div>

export default function App() {
  const [sesion, setSesion] = useState(undefined)
  // El perfil se guarda junto al id de usuario: si cambia la sesion, el perfil viejo deja de valer solo
  const [perfilCargado, setPerfilCargado] = useState(null)
  const usuarioId = sesion?.user.id
  const perfil = usuarioId && perfilCargado?.id === usuarioId ? perfilCargado.datos : undefined

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!usuarioId) return
    cargarPerfil(usuarioId)
      .then((datos) => setPerfilCargado({ id: usuarioId, datos }))
      .catch(() => setPerfilCargado({ id: usuarioId, datos: null }))
  }, [usuarioId])

  if (sesion === undefined) return <Cargando />
  if (!sesion) return <Ingreso />
  if (perfil === undefined) return <Cargando />
  if (!perfil?.activo) {
    return (
      <div className="ingreso">
        <div className="panel ingreso-caja">
          <img src="/logo-crop.png" alt="Flor del Norte" />
          <h1>Cuenta pendiente</h1>
          <p className="nota">Tu cuenta ({sesion.user.email}) está creada. Falta que el administrador te habilite.</p>
          <button onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </div>
    )
  }
  return <Aplicacion perfil={perfil} />
}

function Aplicacion({ perfil }) {
  const esAdmin = perfil.rol === 'admin'
  const [seccion, setSeccion] = useState('nuevo')
  const [empresa, setEmpresa] = useState(EMPRESA_POR_DEFECTO)
  const [presupuestos, setPresupuestos] = useState([])
  const [apodos, setApodos] = useState({})
  const [actual, setActual] = useState(presupuestoInicial)
  const [cargado, setCargado] = useState(false)
  const [aviso, setAviso] = useState(null)

  const avisar = useCallback((texto, tipo = 'ok') => {
    setAviso({ texto, tipo })
    setTimeout(() => setAviso(null), tipo === 'error' ? 6000 : 3000)
  }, [])

  const avisarError = useCallback((e) => avisar(`No se pudo completar: ${e.message ?? e}`, 'error'), [avisar])

  useEffect(() => {
    Promise.all([cargarEmpresa(), cargarPresupuestos(), cargarApodos()])
      .then(([e, p, a]) => { setEmpresa(e); setPresupuestos(p); setApodos(a) })
      .catch(avisarError)
      .finally(() => setCargado(true))
  }, [avisarError])

  // Guarda el presupuesto en edicion y aprende los apodos corregidos. Devuelve el guardado, o null si fallo.
  const guardar = async () => {
    try {
      const aprendidos = aprenderDe(actual.lineas, apodos)
      if (aprendidos.length) {
        await guardarApodos(aprendidos)
        setApodos((previos) => ({ ...previos, ...Object.fromEntries(aprendidos) }))
      }
      const limpio = { ...actual, lineas: actual.lineas.map((l) => ({ ...l, corregido: false })) }
      const guardado = { ...(await guardarPresupuesto(limpio, calcular(limpio).neto)), clave: actual.clave }
      setActual(guardado)
      setPresupuestos((lista) => (lista.some((p) => p.numero === guardado.numero)
        ? lista.map((p) => (p.numero === guardado.numero ? guardado : p))
        : [guardado, ...lista]))
      const extra = aprendidos.length ? ` · ${aprendidos.length === 1 ? '1 apodo aprendido' : `${aprendidos.length} apodos aprendidos`}` : ''
      avisar(`Presupuesto N° ${guardado.numero} guardado${extra}`)
      return guardado
    } catch (e) {
      avisarError(e)
      return null
    }
  }

  const cambiarEstado = async (numero, estado) => {
    try {
      await cambiarEstadoPresupuesto(numero, estado)
      setPresupuestos((lista) => lista.map((p) => (p.numero === numero ? { ...p, estado } : p)))
    } catch (e) {
      avisarError(e)
    }
  }

  const guardarApodo = async (apodo, datos) => {
    try {
      await guardarApodos([[apodo, datos]])
      setApodos((previos) => ({ ...previos, [apodo]: datos }))
    } catch (e) {
      avisarError(e)
    }
  }

  const olvidarApodo = async (apodo) => {
    try {
      await borrarApodo(apodo)
      setApodos((previos) => Object.fromEntries(Object.entries(previos).filter(([clave]) => clave !== apodo)))
    } catch (e) {
      avisarError(e)
    }
  }

  const guardarDatosEmpresa = async (datos) => {
    try {
      await guardarEmpresa(datos)
      setEmpresa(datos)
      avisar('Datos de la empresa guardados')
    } catch (e) {
      avisarError(e)
    }
  }

  const irA = (id) => {
    // "Nuevo presupuesto" desde otra seccion arranca uno en blanco
    if (id === 'nuevo' && seccion !== 'nuevo') setActual(presupuestoVacio())
    setSeccion(id)
  }

  return (
    <div className="app">
      <header className="barra no-imprimir">
        <img src="/logo-crop.png" alt="Flor del Norte" className="barra-logo" />
        <nav>
          {SECCIONES.filter(([, , rol]) => !rol || esAdmin).map(([id, nombre]) => (
            <button key={id} className={seccion === id ? 'activo' : ''} onClick={() => irA(id)}>{nombre}</button>
          ))}
        </nav>
        <span className="usuario">{perfil.nombre || perfil.email} · {esAdmin ? 'Admin' : 'Vendedor'}</span>
        <button className="link" onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>

      {aviso && <div className={`toast no-imprimir ${aviso.tipo}`}>{aviso.texto}</div>}

      <main>
        {!cargado ? <Cargando texto="Cargando datos..." /> : (
          <>
            {seccion === 'nuevo' && (
              <NuevoPresupuesto key={actual.clave} presupuesto={actual} onCambiar={setActual} onGuardar={guardar} empresa={empresa} apodos={apodos} />
            )}
            {seccion === 'historial' && (
              <Historial
                presupuestos={presupuestos}
                empresa={empresa}
                verVendedor={esAdmin}
                onAbrir={(p) => { setActual({ ...p, clave: `n${p.numero}` }); setSeccion('nuevo') }}
                onCambiarEstado={cambiarEstado}
              />
            )}
            {seccion === 'catalogo' && <Catalogo />}
            {seccion === 'apodos' && <Apodos apodos={apodos} onGuardar={guardarApodo} onBorrar={esAdmin ? olvidarApodo : null} />}
            {seccion === 'empresa' && esAdmin && <Empresa empresa={empresa} onGuardar={guardarDatosEmpresa} />}
            {seccion === 'usuarios' && esAdmin && <Usuarios yo={perfil} onError={avisarError} />}
          </>
        )}
      </main>
    </div>
  )
}
