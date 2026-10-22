-- Agrega la lista Trade como opcion valida. Correr una vez en Supabase > SQL Editor.
alter table public.presupuestos drop constraint if exists presupuestos_lista_check;
alter table public.presupuestos
  add constraint presupuestos_lista_check check (lista in ('premium', 'mayorista', 'trade'));
