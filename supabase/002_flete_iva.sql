-- Flete e IVA opcionales por presupuesto. Correr una vez en Supabase > SQL Editor.
alter table public.presupuestos
  add column if not exists flete numeric not null default 0,
  add column if not exists iva_pct numeric not null default 0 check (iva_pct in (0, 10.5, 21));

comment on column public.presupuestos.total is 'Productos con descuento, sin flete ni IVA. Es lo que suman los reportes.';
