-- Migration 002: Add usuario_centro role + capacitaciones tables + novedades + inversion_emc

-- 1. Update rol CHECK constraint to include usuario_centro
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('paciente', 'enfermera', 'medico', 'admin', 'usuario_centro'));

-- 2. Módulos de capacitación (catalog)
CREATE TABLE IF NOT EXISTS modulos_capacitacion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  descripcion text,
  duracion_min int DEFAULT 30,
  orden       int DEFAULT 0,
  tipo        text CHECK (tipo IN ('video', 'lectura', 'evaluacion')) DEFAULT 'video',
  url_contenido text,
  created_at  timestamptz DEFAULT now()
);

-- 3. Progreso de capacitación por usuario
CREATE TABLE IF NOT EXISTS progreso_capacitacion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id   uuid REFERENCES modulos_capacitacion(id) ON DELETE CASCADE,
  completado  boolean DEFAULT false,
  puntaje     int,
  fecha_completado timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(usuario_id, modulo_id)
);

-- 4. Inversión EMC por médico
CREATE TABLE IF NOT EXISTS inversion_emc (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id   uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  centro_id   uuid REFERENCES centros(id) ON DELETE CASCADE,
  periodo     text NOT NULL,          -- e.g. '2025-Q1', '2025-03'
  capacitaciones_realizadas int DEFAULT 0,
  procedimientos_realizados int DEFAULT 0,
  monto_invertido numeric(12,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(medico_id, centro_id, periodo)
);

-- 5. Novedades / alertas
CREATE TABLE IF NOT EXISTS novedades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text CHECK (tipo IN ('calidad', 'reproceso', 'capacitacion', 'insumos', 'otro')) DEFAULT 'otro',
  nivel       text CHECK (nivel IN ('alto', 'medio', 'bajo')) DEFAULT 'medio',
  titulo      text NOT NULL,
  descripcion text,
  centro_id   uuid REFERENCES centros(id) ON DELETE SET NULL,
  responsable text,
  sla_dias    int DEFAULT 7,
  estado      text CHECK (estado IN ('abierta', 'en_gestion', 'cerrada')) DEFAULT 'abierta',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 6. RLS policies for new tables
ALTER TABLE modulos_capacitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_capacitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE inversion_emc ENABLE ROW LEVEL SECURITY;
ALTER TABLE novedades ENABLE ROW LEVEL SECURITY;

-- Modules: readable by all authenticated, writable by admin
CREATE POLICY "modulos_read_all" ON modulos_capacitacion FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "modulos_admin_write" ON modulos_capacitacion FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- Progreso: users see their own, admin sees all
CREATE POLICY "progreso_own" ON progreso_capacitacion FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "progreso_admin" ON progreso_capacitacion FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'usuario_centro'))
);
CREATE POLICY "progreso_insert_own" ON progreso_capacitacion FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "progreso_update_own" ON progreso_capacitacion FOR UPDATE USING (usuario_id = auth.uid());

-- Inversión: admin and usuario_centro can read; admin can write
CREATE POLICY "inversion_read" ON inversion_emc FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'usuario_centro', 'medico'))
);
CREATE POLICY "inversion_admin_write" ON inversion_emc FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- Novedades: admin and usuario_centro
CREATE POLICY "novedades_read" ON novedades FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'usuario_centro'))
);
CREATE POLICY "novedades_write" ON novedades FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'usuario_centro'))
);

-- 7. Seed: sample capacitación modules
INSERT INTO modulos_capacitacion (titulo, descripcion, duracion_min, orden, tipo) VALUES
  ('Introducción a COLONLYTELY', 'Mecanismo de acción, indicaciones y contraindicaciones del producto', 20, 1, 'video'),
  ('Protocolo de preparación intestinal', 'Pasos detallados para la preparación ideal del paciente', 30, 2, 'video'),
  ('Escala de Boston: calificación', 'Cómo evaluar y registrar la calidad de preparación según la escala de Boston', 25, 3, 'lectura'),
  ('Manejo de efectos adversos', 'Identificación y manejo de reacciones adversas durante la preparación', 20, 4, 'video'),
  ('Evaluación final Módulo 1', 'Evaluación de conocimientos sobre preparación intestinal', 15, 5, 'evaluacion')
ON CONFLICT DO NOTHING;
