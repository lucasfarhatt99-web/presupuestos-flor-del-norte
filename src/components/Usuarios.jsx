import { useEffect, useState } from 'react'
import { cargarPerfiles, actualizarPerfil } from '../lib/almacen.js'
import { fecha } from '../lib/formato.js'

export default function Usuarios({ yo, onError }) {
  const [perfiles, setPerfiles] = useState(null)

  useEffect(() => {
    cargarPerfiles().then(setPerfiles).catch(onError)
  }, [onError])

  const cambiar = async (id, cambios) => {
    try {
      const actualizado = await actualizarPerfil(id, cambios)
      setPerfiles((lista) => lista.map((p) => (p.id === id ? actualizado : p)))
    } catch (e) {
      onError(e)
    }
  }

  if (!perfiles) return <section className="panel"><p className="vacio">Cargando usuarios...</p></section>

  const pendientes = perfiles.filter((p) => !p.activo).length

  return (
    <section className="panel usuarios">
      <p className="nota">
        Cada persona se crea la cuenta desde "Pedir acceso" en la pantalla de ingreso. Acá la habilitás y elegís su rol.
        Un vendedor ve solo sus presupuestos; un admin ve todo y maneja empresa y usuarios.
        {pendientes > 0 && <strong> Hay {pendientes} {pendientes === 1 ? 'cuenta esperando' : 'cuentas esperando'} habilitación.</strong>}
      </p>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acceso</th><th>Alta</th></tr></thead>
          <tbody>
            {perfiles.map((p) => {
              const soyYo = p.id === yo.id
              return (
                <tr key={p.id} className={p.activo ? '' : 'fila-pendiente'}>
                  <td>{p.nombre || '-'}{soyYo && <small className="aprendido">vos</small>}</td>
                  <td>{p.email}</td>
                  <td>
                    <select value={p.rol} disabled={soyYo} onChange={(e) => cambiar(p.id, { rol: e.target.value })}>
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button className={p.activo ? '' : 'primario'} disabled={soyYo} onClick={() => cambiar(p.id, { activo: !p.activo })}>
                      {p.activo ? 'Quitar acceso' : 'Habilitar'}
                    </button>
                  </td>
                  <td>{fecha(p.creado)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
