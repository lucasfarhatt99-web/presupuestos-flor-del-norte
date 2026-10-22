import { PRODUCTOS, LISTAS, CONDICIONES, FAMILIAS, VIGENCIA_LISTAS, SABORES_ALMOHADAS } from '../data/catalogo.js'
import { moneda } from '../lib/formato.js'

const listas = Object.values(LISTAS)
const corto = (lista) => lista.nombre.replace('Lista ', '')

export default function Catalogo() {
  const paquetes = PRODUCTOS.filter((p) => p.tipo === 'paquete')
  const granel = PRODUCTOS.filter((p) => p.tipo === 'granel')

  return (
    <section className="panel catalogo">
      <p className="nota">Listas de precios vigentes: {VIGENCIA_LISTAS}. El precio por caja es el precio por bolsa por la cantidad de bolsas de la caja. Sabores de almohadas en paquete: {SABORES_ALMOHADAS.join(', ')}.</p>

      <h2>Paquetes</h2>
      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Bolsa</th><th className="num">Bolsas/caja</th><th className="num">Bultos/palet</th>
              {listas.map((l) => (
                <th key={l.id} className="num" colSpan={2}>{corto(l)}<br /><small>bolsa · caja</small></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paquetes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.presentacion}</td>
                <td className="num">{p.bolsasPorCaja}</td><td className="num">{p.bultosPorPalet}</td>
                {listas.map((l) => <PreciosPaquete key={l.id} precios={p.precios[l.id]} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Granel</h2>
      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Bolsa</th><th className="num">Bolsas/palet</th>
              {listas.map((l) => <th key={l.id} className="num">{corto(l)}</th>)}
            </tr>
          </thead>
          <tbody>
            {granel.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td><td>{p.presentacion}</td><td className="num">{p.bolsasPorPalet}</td>
                {listas.map((l) => <td key={l.id} className="num">{moneda(p.precios[l.id].bolsa)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Condiciones de cada lista</h2>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Familia</th>{listas.map((l) => <th key={l.id}>{corto(l)}</th>)}</tr></thead>
          <tbody>
            {Object.keys(CONDICIONES.premium).map((f) => (
              <tr key={f}>
                <td>{FAMILIAS[f]}</td>
                {listas.map((l) => <td key={l.id}>{CONDICIONES[l.id][f]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const PreciosPaquete = ({ precios }) => (
  <>
    <td className="num">{moneda(precios.bolsa)}</td>
    <td className="num">{moneda(precios.caja)}</td>
  </>
)
