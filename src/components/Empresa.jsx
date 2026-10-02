import { useState } from 'react'

const CAMPOS = [
  ['razonSocial', 'Razón social'],
  ['cuit', 'CUIT'],
  ['condicionIva', 'Condición frente al IVA (opcional)'],
  ['direccion', 'Dirección'],
  ['email', 'Email (opcional)'],
  ['puntoVenta', 'Punto de venta', 'number'],
  ['validezDias', 'Validez del presupuesto (días)', 'number'],
  ['leyendaIva', 'Leyenda de IVA'],
  ['condiciones', 'Condiciones comerciales'],
]

// Se edita un borrador local y se guarda en la base con el boton, no en cada tecla
export default function Empresa({ empresa, onGuardar }) {
  const [borrador, setBorrador] = useState(empresa)
  const [guardando, setGuardando] = useState(false)
  const cambiado = CAMPOS.some(([clave]) => String(borrador[clave]) !== String(empresa[clave]))

  const guardar = async () => {
    setGuardando(true)
    await onGuardar(borrador)
    setGuardando(false)
  }

  return (
    <section className="panel empresa">
      <p className="nota">Estos datos salen en el rótulo de cada presupuesto.</p>
      <div className="formulario">
        {CAMPOS.map(([clave, etiqueta, tipo]) => (
          <label key={clave} className={clave === 'condiciones' ? 'ancho' : ''}>
            {etiqueta}
            <input type={tipo ?? 'text'} value={borrador[clave]} onChange={(e) => setBorrador({ ...borrador, [clave]: e.target.value })} />
          </label>
        ))}
      </div>
      <div className="acciones pie-empresa">
        <button className="primario" onClick={guardar} disabled={!cambiado || guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        {cambiado && <button className="link" onClick={() => setBorrador(empresa)}>Descartar</button>}
      </div>
    </section>
  )
}
