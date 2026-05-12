-- ============================================================
-- Migration 003 — Fase -1 (Puente Tecnoquímicas)
--
-- Añade:
--   • Roles visitador y gerente
--   • Tabla centros_programa  (universo de centros que el visitador puede registrar)
--   • Tabla visitas           (cada visita del promotor a un centro)
--   • Columnas nuevas en novedades (codigo, fecha, dias_transcurridos)
--   • Valores nuevos en CHECK constraints de novedades, manteniendo retro-compat
-- ============================================================

-- 1. Roles nuevos en usuarios.rol --------------------------------------------------
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN (
    'paciente', 'enfermera', 'medico', 'admin',
    'usuario_centro', 'visitador', 'gerente'
  ));

-- 2. centros_programa ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_programa (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               text NOT NULL,
  ciudad               text,
  regional             text,
  incluido_en_programa boolean DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_centros_programa_ciudad   ON centros_programa(ciudad);
CREATE INDEX IF NOT EXISTS idx_centros_programa_incluido ON centros_programa(incluido_en_programa);

-- 3. visitas ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitas (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitador_id         uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  centro_id            uuid REFERENCES centros_programa(id) ON DELETE CASCADE,
  fecha                date DEFAULT current_date,
  estado               text DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente', 'en_curso', 'completa')),
  medico_lider         text,
  procedimientos_mes   int  DEFAULT 0,
  travad_pik_pct       int  DEFAULT 0,
  travad_colonpeg_pct  int  DEFAULT 0,
  otros_pct            int  DEFAULT 0,
  top_medicos          jsonb DEFAULT '[]'::jsonb,
  historial            jsonb DEFAULT '[]'::jsonb,
  visitas_anio         int  DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitas_visitador ON visitas(visitador_id);
CREATE INDEX IF NOT EXISTS idx_visitas_centro    ON visitas(centro_id);
CREATE INDEX IF NOT EXISTS idx_visitas_estado    ON visitas(estado);

CREATE TRIGGER visitas_updated_at
  BEFORE UPDATE ON visitas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. novedades — extensión in-place -------------------------------------------------
ALTER TABLE novedades ADD COLUMN IF NOT EXISTS codigo              text;
ALTER TABLE novedades ADD COLUMN IF NOT EXISTS fecha               date DEFAULT current_date;
ALTER TABLE novedades ADD COLUMN IF NOT EXISTS dias_transcurridos  int  DEFAULT 0;

-- Backfill: rellenar fecha con created_at y generar codigos NOV-YYYY-NNN
UPDATE novedades
   SET fecha = COALESCE(fecha, created_at::date)
 WHERE fecha IS NULL;

WITH numeradas AS (
  SELECT id,
         row_number() OVER (PARTITION BY date_part('year', fecha) ORDER BY created_at) AS n,
         date_part('year', fecha)::int AS anio
    FROM novedades
   WHERE codigo IS NULL
)
UPDATE novedades n
   SET codigo = 'NOV-' || numeradas.anio || '-' || lpad(numeradas.n::text, 3, '0')
  FROM numeradas
 WHERE n.id = numeradas.id;

-- Unique (parcial: solo cuando hay codigo). Permite ser opcional al inicio.
CREATE UNIQUE INDEX IF NOT EXISTS idx_novedades_codigo
  ON novedades(codigo) WHERE codigo IS NOT NULL;

-- Expandir CHECK de tipo: acepta tanto los valores legacy (lowercase) como los nuevos
ALTER TABLE novedades DROP CONSTRAINT IF EXISTS novedades_tipo_check;
ALTER TABLE novedades ADD CONSTRAINT novedades_tipo_check CHECK (
  tipo IN (
    -- legacy (generadas por actions.ts)
    'calidad', 'reproceso', 'capacitacion', 'insumos', 'otro',
    -- nuevos (UI Fase -1)
    'Calidad', 'Variación Producto', 'Datos', 'Clínica'
  )
);

-- Expandir CHECK de nivel
ALTER TABLE novedades DROP CONSTRAINT IF EXISTS novedades_nivel_check;
ALTER TABLE novedades ADD CONSTRAINT novedades_nivel_check CHECK (
  nivel IN ('alto', 'medio', 'bajo', 'Alto', 'Medio', 'Bajo')
);

-- Expandir CHECK de estado
ALTER TABLE novedades DROP CONSTRAINT IF EXISTS novedades_estado_check;
ALTER TABLE novedades ADD CONSTRAINT novedades_estado_check CHECK (
  estado IN ('abierta', 'en_gestion', 'cerrada', 'Abierta', 'En gestión', 'Cerrada')
);

-- titulo era NOT NULL en la migración previa; ahora puede venir descripcion sin titulo
ALTER TABLE novedades ALTER COLUMN titulo DROP NOT NULL;

-- FK opcional a centros_programa (manteniendo el legacy centros)
ALTER TABLE novedades ADD COLUMN IF NOT EXISTS centro_programa_id uuid REFERENCES centros_programa(id) ON DELETE SET NULL;

-- 5. RLS ----------------------------------------------------------------------------
ALTER TABLE centros_programa ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas          ENABLE ROW LEVEL SECURITY;

-- centros_programa: visitadores, gerentes y admin leen todo
CREATE POLICY "centros_programa_read" ON centros_programa FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM usuarios u
              WHERE u.id = auth.uid()
                AND u.rol IN ('visitador', 'gerente', 'admin'))
  );

-- Solo gerente y admin pueden modificar el universo de centros
CREATE POLICY "centros_programa_write_gerente" ON centros_programa FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios u
              WHERE u.id = auth.uid() AND u.rol IN ('gerente', 'admin'))
  );

CREATE POLICY "centros_programa_update_all" ON centros_programa FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM usuarios u
              WHERE u.id = auth.uid()
                AND u.rol IN ('visitador', 'gerente', 'admin'))
  );

-- visitas:
--   • visitador ve solo sus visitas
--   • gerente y admin ven todas
CREATE POLICY "visitas_read_propias" ON visitas FOR SELECT
  USING (
    visitador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM usuarios u
                 WHERE u.id = auth.uid() AND u.rol IN ('gerente', 'admin'))
  );

CREATE POLICY "visitas_insert_visitador" ON visitas FOR INSERT
  WITH CHECK (
    visitador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM usuarios u
                 WHERE u.id = auth.uid() AND u.rol IN ('gerente', 'admin'))
  );

CREATE POLICY "visitas_update_visitador" ON visitas FOR UPDATE
  USING (
    visitador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM usuarios u
                 WHERE u.id = auth.uid() AND u.rol IN ('gerente', 'admin'))
  );

-- novedades: ampliar políticas existentes para incluir visitador y gerente
DROP POLICY IF EXISTS "novedades_read"  ON novedades;
DROP POLICY IF EXISTS "novedades_write" ON novedades;

CREATE POLICY "novedades_read_all_roles" ON novedades FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM usuarios u
              WHERE u.id = auth.uid()
                AND u.rol IN ('admin', 'usuario_centro', 'gerente', 'visitador'))
  );

CREATE POLICY "novedades_write_gestion" ON novedades FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios u
              WHERE u.id = auth.uid()
                AND u.rol IN ('admin', 'usuario_centro', 'gerente', 'visitador'))
  );

-- 6. Función auxiliar: siguiente código de novedad (NOV-YYYY-NNN) -------------------
CREATE OR REPLACE FUNCTION siguiente_codigo_novedad()
RETURNS text AS $$
DECLARE
  anio  int := date_part('year', current_date)::int;
  ultimo int;
BEGIN
  SELECT COALESCE(
           MAX( (regexp_match(codigo, '^NOV-' || anio || '-(\d+)$'))[1]::int ),
           0
         )
    INTO ultimo
    FROM novedades
   WHERE codigo LIKE 'NOV-' || anio || '-%';
  RETURN 'NOV-' || anio || '-' || lpad((ultimo + 1)::text, 3, '0');
END;
$$ LANGUAGE plpgsql;
