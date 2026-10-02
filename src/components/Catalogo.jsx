import { PRODUCTOS, CONDICIONES, FAMILIAS, VIGENCIA_LISTAS, SABORES_ALMOHADAS } from '../data/catalogo.js'
import { moneda } from '../lib/formato.js'

export default function Catalogo() {
  const paquetes = PRODUCTOS.filter((p) => p.tipo === 'paquete')
  const granel = PRODUCTOS.filter((p) => p.tipo === 'granel')

  return (
    <section className="panel catalogo">
      <p className="nota">Listas de precios vigentes: {VIGENCIA_LISTAS}. Sabores de almohadas en paquete: {SABORES_ALMOHADAS.join(', ')}.</p>

      <h2>Paquetes</h2>
      <div className="tabla-scroll">
        <table>
          <thead>
            <tr><th>Producto</th><th>Bolsa</th><th className="num">Bolsas/caja</th><th className="num">Bultos/palet</th>
              <th className="num">Premium bolsa</th><th className="num">Premium caja</th><th className="num">Mayorista bolsa</th><th className="num">Mayorista caja</th></tr>
          </thead>
          <tbody>
            {paquetes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}{p.aviso && <small className="motivo">{p.aviso}</small>}</td><td>{p.presentacion}</td>
                <td className="num">{p.bolsasPorCaja}</td><td className="num">{p.bultosPorPalet}</td>
                <td className="num">{moneda(p.precios.premium.bolsa)}</td><td className="num">{moneda(p.precios.premium.caja)}</td>
                <td className="num">{moneda(p.precios.mayorista.bolsa)}</td><td className="num">{moneda(p.precios.mayorista.caja)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Granel</h2>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Producto</th><th>Bolsa</th><th className="num">Bolsas/palet</th><th className="num">Premium</th><th className="num">Mayorista</th></tr></thead>
          <tbody>
            {granel.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td><td>{p.presentacion}</td><td className="num">{p.bolsasPorPalet}</td>
                <td className="num">{moneda(p.precios.premium.bolsa)}</td><td className="num">{moneda(p.precios.mayorista.bolsa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Condiciones de cada lista</h2>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Familia</th><th>Premium</th><th>Mayorista</th></tr></thead>
          <tbody>
            {Object.keys(CONDICIONES.premium).map((f) => (
              <tr key={f}><td>{FAMILIAS[f]}</td><td>{CONDICIONES.premium[f]}</td><td>{CONDICIONES.mayorista[f]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
