const CAMPOS = [
  ['razonSocial', 'Razón social'],
  ['cuit', 'CUIT'],
  ['condicionIva', 'Condición frente al IVA'],
  ['direccion', 'Dirección'],
  ['telefono', 'Teléfono'],
  ['email', 'Email'],
  ['puntoVenta', 'Punto de venta', 'number'],
  ['validezDias', 'Validez del presupuesto (días)', 'number'],
  ['leyendaIva', 'Leyenda de IVA'],
  ['condiciones', 'Condiciones comerciales'],
]

export default function Empresa({ empresa, onCambiar }) {
  return (
    <section className="panel empresa">
      <p className="nota">Estos datos salen en el rótulo de cada presupuesto.</p>
      <div className="formulario">
        {CAMPOS.map(([clave, etiqueta, tipo]) => (
          <label key={clave} className={clave === 'condiciones' ? 'ancho' : ''}>
            {etiqueta}
            <input type={tipo ?? 'text'} value={empresa[clave]} onChange={(e) => onCambiar({ ...empresa, [clave]: e.target.value })} />
          </label>
        ))}
      </div>
    </section>
  )
}
