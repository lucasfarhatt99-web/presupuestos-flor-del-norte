import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const MENSAJES_ERROR = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'User already registered': 'Ese email ya tiene cuenta. Ingresá con tu contraseña.',
  'Email not confirmed': 'Falta confirmar el email (el admin tiene que desactivar la confirmación en Supabase).',
}

const traducir = (mensaje) =>
  MENSAJES_ERROR[mensaje] ?? (mensaje.includes('at least') ? 'La contraseña tiene que tener al menos 6 caracteres.' : mensaje)

export default function Ingreso() {
  const [modo, setModo] = useState('ingresar')
  const [datos, setDatos] = useState({ nombre: '', email: '', clave: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    const { error } = modo === 'ingresar'
      ? await supabase.auth.signInWithPassword({ email: datos.email, password: datos.clave })
      : await supabase.auth.signUp({ email: datos.email, password: datos.clave, options: { data: { nombre: datos.nombre } } })
    if (error) setError(traducir(error.message))
    setEnviando(false)
  }

  const registro = modo === 'registrar'

  return (
    <div className="ingreso">
      <form className="panel ingreso-caja" onSubmit={enviar}>
        <img src="/logo-crop.png" alt="Flor del Norte" />
        <h1>{registro ? 'Crear cuenta' : 'Presupuestos'}</h1>
        {registro && (
          <label>Nombre<input value={datos.nombre} onChange={cambiar('nombre')} required autoComplete="name" /></label>
        )}
        <label>Email<input type="email" value={datos.email} onChange={cambiar('email')} required autoComplete="email" /></label>
        <label>Contraseña
          <input type="password" value={datos.clave} onChange={cambiar('clave')} required minLength={6} autoComplete={registro ? 'new-password' : 'current-password'} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primario" disabled={enviando}>{enviando ? 'Un momento...' : registro ? 'Crear cuenta' : 'Ingresar'}</button>
        <button type="button" className="link" onClick={() => { setModo(registro ? 'ingresar' : 'registrar'); setError('') }}>
          {registro ? 'Ya tengo cuenta' : 'No tengo cuenta: pedir acceso'}
        </button>
        {registro && <p className="nota">Después de crear la cuenta, el administrador tiene que habilitarte.</p>}
      </form>
    </div>
  )
}
