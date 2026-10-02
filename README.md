# Presupuestos Flor del Norte

Arma presupuestos formales a partir de un pedido de WhatsApp pegado como texto.

## Flujo

1. Pegar el mensaje del cliente y tocar **Interpretar pedido**.
2. Revisar las líneas: cada una queda *Identificado*, *Revisar* o *Sin coincidencia*. Se corrige producto, caja/bolsa y cantidad.
3. **Guardar**: queda en el historial y la app aprende los nombres corregidos (sección **Apodos**).
4. **Descargar PDF** (hoja A4 con rótulo) o **Enviar por WhatsApp**.

## Dónde está cada cosa

| Archivo | Qué tiene |
|---|---|
| `src/data/catalogo.js` | Productos, precios de las listas Premium y Mayorista, condiciones y alias de fábrica |
| `src/lib/interpretar.js` | Intérprete de mensajes (reglas + apodos aprendidos) |
| `src/lib/aprender.js` | Cómo se aprenden apodos al guardar |
| `src/lib/almacen.js` | Persistencia (hoy `localStorage`, después Supabase) |
| `src/components/DocumentoPresupuesto.jsx` | La hoja del presupuesto que se imprime |

Para actualizar precios, editar `src/data/catalogo.js`.

## Desarrollo

```bash
npm install
npm run dev
```

`http://localhost:5173/?ejemplo` abre con un pedido de muestra ya interpretado.

## Pendiente

- Supabase: login (admin y vendedores), datos compartidos online.
- Publicación en Cloudflare Pages.
- Reportes y facturación ARCA.
