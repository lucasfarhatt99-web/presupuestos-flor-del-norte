-- Los presupuestos nuevos se numeran desde 100000 (los ya guardados conservan su numero).
-- Correr una vez en Supabase > SQL Editor.
alter table public.presupuestos alter column numero restart with 100000;
