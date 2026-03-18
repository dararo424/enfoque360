-- ============================================================
-- Enfoque 360 - Esquema de base de datos para Tecnoquímicas
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: centros
-- ============================================================
create table if not exists centros (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  ciudad text not null,
  regional text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: usuarios
-- Extiende auth.users de Supabase con info de rol y centro
-- ============================================================
create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('paciente', 'enfermera', 'medico', 'admin')),
  centro_id uuid references centros(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: pacientes
-- ============================================================
create table if not exists pacientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  cedula text not null unique,
  edad integer not null,
  centro_id uuid references centros(id),
  usuario_id uuid references usuarios(id),
  preparacion jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: procedimientos
-- ============================================================
create table if not exists procedimientos (
  id uuid primary key default uuid_generate_v4(),
  paciente_id uuid not null references pacientes(id),
  enfermera_id uuid references usuarios(id),
  medico_id uuid references usuarios(id),
  centro_id uuid not null references centros(id),
  fecha timestamptz not null default now(),
  producto text not null default 'COLONLYTELY',
  estado text not null default 'programado' check (estado in ('programado', 'en_curso', 'completado', 'cancelado')),
  indicadores jsonb default '{}',
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para consultas por fecha y centro (dashboard enfermería)
create index if not exists idx_procedimientos_fecha_centro
  on procedimientos (centro_id, fecha);

create index if not exists idx_procedimientos_enfermera
  on procedimientos (enfermera_id, fecha);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_procedimientos_updated_at
  before update on procedimientos
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table centros enable row level security;
alter table usuarios enable row level security;
alter table pacientes enable row level security;
alter table procedimientos enable row level security;

-- Centros: lectura pública para usuarios autenticados
create policy "centros_select" on centros
  for select to authenticated using (true);

-- Usuarios: cada uno ve su propio registro; admin ve todos
create policy "usuarios_select_own" on usuarios
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Pacientes: enfermeras y médicos del mismo centro ven los pacientes
create policy "pacientes_select_staff" on pacientes
  for select to authenticated
  using (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid()
        and (u.rol in ('enfermera', 'medico', 'admin') or u.id = pacientes.usuario_id)
    )
  );

-- Procedimientos: staff del centro y el propio paciente
create policy "procedimientos_select_staff" on procedimientos
  for select to authenticated
  using (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid()
        and (
          u.rol in ('enfermera', 'medico', 'admin')
          or u.id = (select usuario_id from pacientes p where p.id = procedimientos.paciente_id)
        )
    )
  );

create policy "procedimientos_insert_staff" on procedimientos
  for insert to authenticated
  with check (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid() and u.rol in ('enfermera', 'medico', 'admin')
    )
  );

create policy "procedimientos_update_staff" on procedimientos
  for update to authenticated
  using (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid() and u.rol in ('enfermera', 'medico', 'admin')
    )
  );

-- ============================================================
-- DATOS DE PRUEBA (seed)
-- ============================================================

-- Centro demo
insert into centros (id, nombre, ciudad, regional) values
  ('00000000-0000-0000-0000-000000000001', 'Clínica Demo Bogotá', 'Bogotá', 'Centro'),
  ('00000000-0000-0000-0000-000000000002', 'Hospital Demo Medellín', 'Medellín', 'Antioquia')
on conflict (id) do nothing;
