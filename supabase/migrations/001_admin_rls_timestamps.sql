-- ============================================================
-- Migración 001 — Timestamps en procedimientos + RLS admin
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ---- 1. Columnas de inicio/fin de procedimiento ----
ALTER TABLE procedimientos
  ADD COLUMN IF NOT EXISTS inicio_procedimiento timestamptz,
  ADD COLUMN IF NOT EXISTS fin_procedimiento    timestamptz;

-- ---- 2. Política: admin puede insertar/actualizar centros ----
DROP POLICY IF EXISTS "centros_insert_admin" ON centros;
CREATE POLICY "centros_insert_admin" ON centros
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin')
  );

DROP POLICY IF EXISTS "centros_update_admin" ON centros;
CREATE POLICY "centros_update_admin" ON centros
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin')
  );

-- ---- 3. Política: admin puede actualizar usuarios ----
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;
CREATE POLICY "usuarios_update_admin" ON usuarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin')
  );

-- ---- 4. Política: insertar pacientes (staff + paciente propio) ----
DROP POLICY IF EXISTS "pacientes_insert_staff" ON pacientes;
CREATE POLICY "pacientes_insert_staff" ON pacientes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'enfermera', 'paciente')
    )
  );

DROP POLICY IF EXISTS "pacientes_update_staff" ON pacientes;
CREATE POLICY "pacientes_update_staff" ON pacientes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND (u.rol IN ('admin', 'enfermera') OR u.id = pacientes.usuario_id)
    )
  );

-- ---- 5. Admin puede insertar procedimientos ----
DROP POLICY IF EXISTS "procedimientos_insert_admin" ON procedimientos;
CREATE POLICY "procedimientos_insert_admin" ON procedimientos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('enfermera', 'medico', 'admin')
    )
  );
