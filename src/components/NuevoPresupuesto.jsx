import { useState } from 'react'
import { PRODUCTOS, LISTAS, productoPorId, etiquetaProducto, unidadesDe, precioDe } from '../data/catalogo.js'
import { interpretarMensaje, MENSAJE_EJEMPLO as EJEMPLO } from '../lib/interpretar.js'
import { calcular, moneda, numeroComprobante } from '../lib/formato.js'
import DocumentoPresupuesto from './DocumentoPresupuesto.jsx'

const ESTADOS = {
  ok: { texto: 'Identificado', clase: 'ok' },
  duda: { texto: 'Revisar', clase: 'duda' },
  no: { texto: 'Sin coincidencia', clase: 'no' },
  manual: { texto: 'Manual', clase: 'manual' },
}

export default function NuevoPresupuesto({ presupuesto, onCambiar, onGuardar, empresa, apodos }) {
  const [mensaje, setMensaje] = useState(presupuesto.mensajeOriginal ?? '')
  const { lineas, lista, descuentoPct, cliente } = presupuesto
  const { total } = calcular(lineas, lista, descuentoPct)

  const actualizar = (cambios) => onCambiar({ ...presupuesto, ...cambios })
  const actualizarLinea = (n, cambios) =>
    actualizar({ lineas: lineas.map((l, i) => (i === n ? { ...l, ...cambios, estado: cambios.estado ?? (l.estado === 'no' ? 'manual' : l.estado === 'duda' ? 'ok' : l.estado) } : l)) })

  const interpretar = () => actualizar({ lineas: interpretarMensaje(mensaje, apodos), mensajeOriginal: mensaje })

  const agregarLinea = () =>
    actualizar({ lineas: [...lineas, { original: '', estado: 'manual', cantidad: 1, productoId: PRODUCTOS[0].id, unidad: 'caja', alternativas: [] }] })

  const cambiarProducto = (n, productoId) => {
    const producto = productoPorId(productoId)
    const unidad = unidadesDe(producto).includes(lineas[n].unidad) ? lineas[n].unidad : unidadesDe(producto)[0]
    actualizarLinea(n, { productoId, unidad, corregido: true })
  }

  const enviarWhatsapp = () => {
    const { items } = calcular(lineas, lista, descuentoPct)
    const detalle = items.map((i) => `- ${i.cantidad} ${i.unidad}${i.cantidad === 1 ? '' : 's'} ${etiquetaProducto(i.producto)}: ${moneda(i.importe)}`).join('\n')
    const texto = `*Presupuesto Flor del Norte N° ${numeroComprobante(empresa.puntoVenta, presupuesto.numero)}*\n${detalle}\n*Total: ${moneda(total)}*\nTe adjunto el PDF con el detalle.`
    window.open(`https://wa.me/${(cliente.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const pendientes = lineas.filter((l) => l.estado === 'duda' || l.estado === 'no').length

  return (
    <div className="nuevo">
      <section className="panel entrada no-imprimir">
        <h2>1. Pegá el pedido</h2>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Pegá acá el mensaje de WhatsApp..."
          rows={6}
        />
        <div className="acciones">
          <button className="primario" onClick={interpretar} disabled={!mensaje.trim()}>Interpretar pedido</button>
          <button className="link" onClick={() => setMensaje(EJEMPLO)}>Usar mensaje de ejemplo</button>
        </div>
        <p className="ayuda">
          En el celular: mantené apretado el mensaje y tocá Copiar (si son varios, seleccionalos todos).
          Cuando corregís un producto y guardás, la app aprende ese nombre para la próxima.
        </p>
      </section>

      <section className="panel revision no-imprimir">
        <div className="panel-titulo">
          <h2>2. Revisá y ajustá</h2>
          {pendientes > 0 && <span className="aviso">{pendientes} {pendientes === 1 ? 'línea para revisar' : 'líneas para revisar'}</span>}
        </div>

        <div className="datos-cliente">
          <label>Cliente<input value={cliente.nombre} onChange={(e) => actualizar({ cliente: { ...cliente, nombre: e.target.value } })} placeholder="Nombre o razón social" /></label>
          <label>CUIT<input value={cliente.cuit} onChange={(e) => actualizar({ cliente: { ...cliente, cuit: e.target.value } })} placeholder="Opcional" /></label>
          <label>WhatsApp<input value={cliente.telefono} onChange={(e) => actualizar({ cliente: { ...cliente, telefono: e.target.value } })} placeholder="381..." /></label>
          <label>Lista
            <div className="segmentado">
              {Object.values(LISTAS).map((l) => (
                <button key={l.id} className={lista === l.id ? 'activo' : ''} onClick={() => actualizar({ lista: l.id })}>{l.nombre.replace('Lista ', '')}</button>
              ))}
            </div>
          </label>
          <label>Descuento %<input type="number" min="0" max="100" value={descuentoPct} onChange={(e) => actualizar({ descuentoPct: e.target.value })} /></label>
        </div>

        {lineas.length === 0 ? (
          <p className="vacio">Interpretá un mensaje o agregá productos a mano.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-revision">
              <thead>
                <tr><th>Estado</th><th>Del mensaje</th><th>Cant.</th><th>Unidad</th><th>Producto</th><th className="num">Unit.</th><th className="num">Importe</th><th /></tr>
              </thead>
              <tbody>
                {lineas.map((l, n) => {
                  const producto = productoPorId(l.productoId)
                  const precio = precioDe(producto, lista, l.unidad)
                  const sugeridos = l.alternativas.length ? PRODUCTOS.filter((p) => l.alternativas.includes(p.id)) : []
                  const resto = PRODUCTOS.filter((p) => !l.alternativas.includes(p.id))
                  return (
                    <tr key={n} className={`fila-${l.estado}`}>
                      <td>
                        <span className={`estado ${ESTADOS[l.estado].clase}`}>{ESTADOS[l.estado].texto}</span>
                        {l.motivo && l.estado === 'duda' && <small className="motivo">{l.motivo}</small>}
                        {l.aprendido && !l.corregido && <small className="aprendido">por apodo "{l.aprendido}"</small>}
                        {l.corregido && l.original && <small className="aprendido">se aprende al guardar</small>}
                      </td>
                      <td className="original">{l.original || '-'}</td>
                      <td><input type="number" min="1" className="cantidad" value={l.cantidad} onChange={(e) => actualizarLinea(n, { cantidad: Number(e.target.value) })} /></td>
                      <td>
                        <select value={l.unidad} onChange={(e) => actualizarLinea(n, { unidad: e.target.value, corregido: true })} disabled={!producto}>
                          {(producto ? unidadesDe(producto) : ['bolsa']).map((u) => (
                            <option key={u} value={u}>{u === 'caja' && producto ? `Caja x${producto.bolsasPorCaja}` : 'Bolsa'}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={l.productoId ?? ''} onChange={(e) => cambiarProducto(n, e.target.value)}>
                          {!l.productoId && <option value="">Elegir producto...</option>}
                          {sugeridos.length > 0 && (
                            <optgroup label="Sugeridos">{sugeridos.map((p) => <option key={p.id} value={p.id}>{etiquetaProducto(p)}</option>)}</optgroup>
                          )}
                          <optgroup label={sugeridos.length ? 'Resto del catálogo' : 'Catálogo'}>
                            {resto.map((p) => <option key={p.id} value={p.id}>{etiquetaProducto(p)}</option>)}
                          </optgroup>
                        </select>
                        {producto?.aviso && lista === 'mayorista' && l.unidad === 'caja' && <small className="motivo">{producto.aviso}</small>}
                      </td>
                      <td className="num">{producto ? moneda(precio) : '-'}</td>
                      <td className="num">{producto ? moneda(precio * l.cantidad) : '-'}</td>
                      <td><button className="quitar" title="Quitar línea" onClick={() => actualizar({ lineas: lineas.filter((_, i) => i !== n) })}>×</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <label className="observaciones">Observaciones (opcional)
          <input value={presupuesto.observaciones} onChange={(e) => actualizar({ observaciones: e.target.value })} placeholder="Ej: entrega en 48 hs, flete a cargo del cliente" />
        </label>

        <div className="pie-revision">
          <button className="link" onClick={agregarLinea}>+ Agregar producto</button>
          <div className="total-revision">Total <strong>{moneda(total)}</strong></div>
        </div>
      </section>

      <section className="panel vista">
        <div className="panel-titulo no-imprimir">
          <h2>3. Presupuesto</h2>
          <div className="acciones">
            <button onClick={onGuardar} disabled={!lineas.some((l) => l.productoId)}>Guardar</button>
            <button onClick={() => window.print()} disabled={!lineas.some((l) => l.productoId)}>Descargar PDF</button>
            <button className="whatsapp" onClick={enviarWhatsapp} disabled={!lineas.some((l) => l.productoId)}>Enviar por WhatsApp</button>
          </div>
        </div>
        <DocumentoPresupuesto presupuesto={presupuesto} empresa={empresa} />
      </section>
    </div>
  )
}
