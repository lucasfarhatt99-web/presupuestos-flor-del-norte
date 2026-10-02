import { useState } from 'react'
import { PRODUCTOS, ALIAS_FAMILIA, FAMILIAS, productoPorId, etiquetaProducto, unidadesDe } from '../data/catalogo.js'
import { extraerApodo } from '../lib/interpretar.js'
import { fecha } from '../lib/formato.js'

const SelectorProducto = ({ valor, onCambiar }) => (
  <select value={valor} onChange={(e) => onCambiar(e.target.value)}>
    {PRODUCTOS.map((p) => <option key={p.id} value={p.id}>{etiquetaProducto(p)}</option>)}
  </select>
)

const SelectorUnidad = ({ productoId, valor, onCambiar }) => {
  const producto = productoPorId(productoId)
  return (
    <select value={valor} onChange={(e) => onCambiar(e.target.value)}>
      {unidadesDe(producto).map((u) => <option key={u} value={u}>{u === 'caja' ? `Caja x${producto.bolsasPorCaja}` : 'Bolsa'}</option>)}
    </select>
  )
}

// onGuardar(apodo, datos) crea o actualiza uno; onBorrar(apodo) solo esta disponible para el admin
export default function Apodos({ apodos, onGuardar, onBorrar }) {
  const [nuevo, setNuevo] = useState({ texto: '', productoId: PRODUCTOS[0].id, unidad: 'caja' })
  const entradas = Object.entries(apodos).sort(([a], [b]) => a.localeCompare(b))
  const claveNueva = extraerApodo(nuevo.texto)

  const editar = (apodo, cambios) => {
    const actual = { ...apodos[apodo], ...cambios }
    if (cambios.productoId && !unidadesDe(productoPorId(cambios.productoId)).includes(actual.unidad)) actual.unidad = 'bolsa'
    onGuardar(apodo, actual)
  }

  const agregar = () => {
    if (claveNueva.length < 3) return
    onGuardar(claveNueva, { productoId: nuevo.productoId, unidad: nuevo.unidad, ejemplo: nuevo.texto, aprendido: new Date().toISOString() })
    setNuevo({ ...nuevo, texto: '' })
  }

  return (
    <section className="panel apodos">
      <p className="nota">
        Cómo nombran tus clientes a cada producto. Se aprenden solos cuando corregís una línea y guardás el presupuesto;
        acá podés revisarlos, cambiarlos o cargarlos a mano. Un apodo aprendido tiene prioridad sobre las reglas generales.
      </p>

      <div className="alta-apodo">
        <label>Cuando el cliente escribe
          <input value={nuevo.texto} onChange={(e) => setNuevo({ ...nuevo, texto: e.target.value })} placeholder='Ej: "palitos salados"' />
        </label>
        <label>Es el producto
          <SelectorProducto valor={nuevo.productoId} onCambiar={(productoId) => setNuevo({ ...nuevo, productoId, unidad: unidadesDe(productoPorId(productoId))[0] })} />
        </label>
        <label>Por defecto en
          <SelectorUnidad productoId={nuevo.productoId} valor={nuevo.unidad} onCambiar={(unidad) => setNuevo({ ...nuevo, unidad })} />
        </label>
        <button className="primario" onClick={agregar} disabled={claveNueva.length < 3}>Agregar</button>
      </div>

      {entradas.length === 0 ? (
        <p className="vacio">Todavía no hay apodos aprendidos.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Apodo</th><th>Visto como</th><th>Producto</th><th>Unidad</th><th>Desde</th><th /></tr></thead>
            <tbody>
              {entradas.map(([apodo, a]) => (
                <tr key={apodo}>
                  <td><strong>{apodo}</strong></td>
                  <td className="original">{a.ejemplo}</td>
                  <td><SelectorProducto valor={a.productoId} onCambiar={(productoId) => editar(apodo, { productoId })} /></td>
                  <td><SelectorUnidad productoId={a.productoId} valor={a.unidad} onCambiar={(unidad) => editar(apodo, { unidad })} /></td>
                  <td>{a.aprendido ? fecha(a.aprendido) : '-'}</td>
                  <td>{onBorrar && <button className="quitar" title="Olvidar apodo" onClick={() => onBorrar(apodo)}>×</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Nombres que ya reconoce de fábrica</h2>
      <ul className="alias-fijos">
        {Object.entries(ALIAS_FAMILIA).map(([familia, alias]) => (
          <li key={familia}><strong>{FAMILIAS[familia]}:</strong> {alias.join(', ')}</li>
        ))}
      </ul>
    </section>
  )
}
