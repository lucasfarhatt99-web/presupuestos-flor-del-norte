import { LISTAS, CONDICIONES, FAMILIAS, VIGENCIA_LISTAS } from '../data/catalogo.js'
import { calcular, moneda, fecha, sumarDias, numeroComprobante, plural } from '../lib/formato.js'

// Hoja A4 del presupuesto. Se imprime / guarda como PDF con window.print().
export default function DocumentoPresupuesto({ presupuesto, empresa }) {
  const { lineas, lista, descuentoPct, cliente, numero, creado, observaciones } = presupuesto
  const { items, subtotal, descuento, total } = calcular(lineas, lista, descuentoPct)
  const familias = [...new Set(items.map((i) => i.producto.familia))].filter((f) => CONDICIONES[lista][f])

  return (
    <article className="hoja">
      <header className="hoja-cabecera">
        <div className="hoja-marca">
          <img src="/logo-crop.png" alt="Flor del Norte" />
          <div className="hoja-empresa">
            <strong>{empresa.razonSocial}</strong>
            <span>CUIT {empresa.cuit} · {empresa.condicionIva}</span>
            <span>{empresa.direccion}</span>
            <span>{empresa.telefono} · {empresa.email}</span>
          </div>
        </div>
        <div className="hoja-comprobante">
          <span className="hoja-tipo">Presupuesto</span>
          <span className="hoja-numero">N° {numeroComprobante(empresa.puntoVenta, numero)}</span>
          <dl>
            <dt>Fecha</dt><dd>{fecha(creado)}</dd>
            <dt>Válido hasta</dt><dd>{fecha(sumarDias(creado, Number(empresa.validezDias)))}</dd>
            <dt>Lista</dt><dd>{LISTAS[lista].nombre}</dd>
          </dl>
        </div>
      </header>

      <section className="hoja-cliente">
        <span className="rotulo">Cliente</span>
        <strong>{cliente.nombre || 'Consumidor'}</strong>
        {(cliente.cuit || cliente.telefono) && (
          <span>{[cliente.cuit && `CUIT ${cliente.cuit}`, cliente.telefono].filter(Boolean).join(' · ')}</span>
        )}
      </section>

      <table className="hoja-tabla">
        <thead>
          <tr>
            <th className="num">Cant.</th>
            <th>Unidad</th>
            <th>Producto</th>
            <th className="num">Precio unit.</th>
            <th className="num">Importe</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, n) => (
            <tr key={n}>
              <td className="num">{i.cantidad}</td>
              <td>
                {plural(i.unidad, i.cantidad)}
                {i.unidad === 'caja' && <small> x{i.producto.bolsasPorCaja}</small>}
              </td>
              <td>{i.producto.nombre} <span className="presentacion">{i.producto.presentacion}</span></td>
              <td className="num">{moneda(i.precio)}</td>
              <td className="num">{moneda(i.importe)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="hoja-totales">
        <dl>
          <dt>Subtotal</dt><dd>{moneda(subtotal)}</dd>
          {descuento > 0 && (<><dt>Descuento {descuentoPct}%</dt><dd>-{moneda(descuento)}</dd></>)}
          <dt className="total">Total</dt><dd className="total">{moneda(total)}</dd>
        </dl>
      </section>

      {observaciones && (
        <section className="hoja-bloque">
          <span className="rotulo">Observaciones</span>
          <p>{observaciones}</p>
        </section>
      )}

      <section className="hoja-bloque">
        <span className="rotulo">Condiciones</span>
        <ul>
          <li>{empresa.leyendaIva}</li>
          <li>{empresa.condiciones}</li>
          <li>Precios de {LISTAS[lista].nombre}, vigencia {VIGENCIA_LISTAS}.
            {familias.length > 0 && ' Volúmenes de aplicación: ' + familias.map((f) => `${FAMILIAS[f]} ${CONDICIONES[lista][f].toLowerCase()}`).join('; ') + '.'}
          </li>
        </ul>
      </section>

      <footer className="hoja-pie">Documento no válido como factura.</footer>
    </article>
  )
}
