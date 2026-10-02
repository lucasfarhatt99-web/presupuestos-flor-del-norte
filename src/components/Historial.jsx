import { LISTAS } from '../data/catalogo.js'
import { calcular, moneda, fecha, numeroComprobante } from '../lib/formato.js'

const ESTADOS_PRESUPUESTO = ['Pendiente', 'Aceptado', 'Rechazado', 'Vencido']

export default function Historial({ presupuestos, empresa, onAbrir, onCambiarEstado }) {
  const conTotales = presupuestos.map((p) => ({ ...p, total: calcular(p.lineas, p.lista, p.descuentoPct).total }))
  const presupuestado = conTotales.reduce((s, p) => s + p.total, 0)
  const vendido = conTotales.filter((p) => p.estado === 'Aceptado').reduce((s, p) => s + p.total, 0)

  return (
    <section className="panel">
      <div className="resumen">
        <div><span>Presupuestos</span><strong>{presupuestos.length}</strong></div>
        <div><span>Presupuestado</span><strong>{moneda(presupuestado)}</strong></div>
        <div><span>Vendido</span><strong>{moneda(vendido)}</strong></div>
        <div><span>Conversión</span><strong>{presupuestado ? Math.round((vendido / presupuestado) * 100) : 0}%</strong></div>
      </div>
      {presupuestos.length === 0 ? (
        <p className="vacio">Todavía no guardaste presupuestos.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-historial">
            <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Lista</th><th className="num">Total</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {[...conTotales].reverse().map((p) => (
                <tr key={p.numero}>
                  <td>{numeroComprobante(empresa.puntoVenta, p.numero)}</td>
                  <td>{fecha(p.creado)}</td>
                  <td>{p.cliente.nombre || 'Consumidor'}</td>
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
