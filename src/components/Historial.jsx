import { LISTAS } from '../data/catalogo.js'
import { moneda, fecha, numeroComprobante } from '../lib/formato.js'

const ESTADOS_PRESUPUESTO = ['Pendiente', 'Aceptado', 'Rechazado', 'Vencido']

// presupuestos ya viene filtrado por la base: el vendedor recibe solo los suyos, el admin todos
export default function Historial({ presupuestos, empresa, verVendedor, onAbrir, onCambiarEstado }) {
  const presupuestado = presupuestos.reduce((s, p) => s + p.total, 0)
  const vendido = presupuestos.filter((p) => p.estado === 'Aceptado').reduce((s, p) => s + p.total, 0)

  return (
    <section className="panel">
      <div className="resumen">
        <div><span>Presupuestos</span><strong>{presupuestos.length}</strong></div>
        <div><span>Presupuestado</span><strong>{moneda(presupuestado)}</strong></div>
        <div><span>Vendido</span><strong>{moneda(vendido)}</strong></div>
        <div><span>Conversión</span><strong>{presupuestado ? Math.round((vendido / presupuestado) * 100) : 0}%</strong></div>
      </div>
      {presupuestos.length === 0 ? (
        <p className="vacio">Todavía no hay presupuestos guardados.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-historial">
            <thead>
              <tr>
                <th>N°</th><th>Fecha</th><th>Cliente</th>{verVendedor && <th>Vendedor</th>}
                <th>Lista</th><th className="num">Total</th><th>Estado</th><th />
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.numero}>
                  <td>{numeroComprobante(empresa.puntoVenta, p.numero)}</td>
                  <td>{fecha(p.creado)}</td>
                  <td>{p.cliente.nombre || 'Consumidor'}</td>
                  {verVendedor && <td>{p.vendedor || '-'}</td>}
                  <td>{LISTAS[p.lista].nombre.replace('Lista ', '')}</td>
                  <td className="num">{moneda(p.total)}</td>
                  <td>
                    <select value={p.estado} onChange={(e) => onCambiarEstado(p.numero, e.target.value)} className={`estado-${p.estado.toLowerCase()}`}>
                      {ESTADOS_PRESUPUESTO.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </td>
                  <td><button className="link" onClick={() => onAbrir(p)}>Abrir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
