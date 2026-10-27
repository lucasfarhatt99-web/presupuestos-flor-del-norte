import { useState } from 'react'
import { DESTINOS_ENVIO, TARIFAS_ENVIO, OPCIONES_ENVIO, NOTAS_ENVIO } from '../data/envios.js'
import { normalizar } from '../lib/interpretar.js'

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const MAXIMO = 30

// Se busca sin tildes ni mayusculas; primero los destinos que empiezan con lo escrito
const buscar = (texto) => {
  const q = normalizar(texto)
  if (q.length < 2) return []
  const puntuados = []
  for (const d of DESTINOS_ENVIO) {
    const destino = normalizar(d.destino)
    const provincia = normalizar(d.provincia)
    if (destino.startsWith(q)) puntuados.push([0, d])
    else if (destino.includes(q)) puntuados.push([1, d])
    else if (provincia.includes(q)) puntuados.push([2, d])
  }
  return puntuados.sort((a, b) => a[0] - b[0] || a[1].destino.localeCompare(b[1].destino)).map(([, d]) => d)
}

export default function Envios() {
  const [texto, setTexto] = useState('')
  const resultados = buscar(texto)

  return (
    <section className="panel envios">
      <h2>Cotizador de envíos · PACK GO</h2>
      <input
        className="buscador"
        type="search"
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscá un destino o una provincia (ej: Salta, Bahía Blanca)"
      />

      {texto.trim().length < 2 ? (
        <ul className="notas-envio">{NOTAS_ENVIO.map((n) => <li key={n}>{n}</li>)}</ul>
      ) : resultados.length === 0 ? (
        <p className="vacio">No hay destinos que coincidan con "{texto}".</p>
      ) : (
        <>
          {resultados.length > MAXIMO && <p className="nota">Mostrando {MAXIMO} de {resultados.length}. Escribí más para afinar.</p>}
          <div className="destinos">
            {resultados.slice(0, MAXIMO).map((d) => (
              <article key={`${d.provincia}-${d.destino}`} className={`destino ${d.tarifa ? '' : 'sin-servicio'}`}>
                <header>
                  <strong>{d.destino}</strong>
                  <span>{d.provincia}</span>
                </header>
                {d.tarifa ? (
                  <dl>
                    {OPCIONES_ENVIO.map((o) => (
                      <div key={o.id}>
                        <dt>{o.nombre}</dt>
                        <dd>{pesos.format(TARIFAS_ENVIO[d.tarifa][o.id])}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="motivo-envio">Sin envío a sucursal ({d.motivo})</p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
