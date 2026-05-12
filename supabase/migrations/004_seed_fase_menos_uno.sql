-- ============================================================
-- Seed Fase -1 (Puente Tecnoquímicas)
--
-- REQUISITO PREVIO: crear los 2 usuarios en Supabase Studio
--   Authentication → Users → Add user
--     visitador@enfoque360.com / Demo1234!   (Auto Confirm User = ON)
--     gerente@enfoque360.com   / Demo1234!   (Auto Confirm User = ON)
--
-- Luego corre este SQL en el SQL Editor de Supabase.
-- Es idempotente: se puede correr varias veces sin duplicar datos.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Vincular auth.users → usuarios (busca por email, no requiere UUID)
-- ---------------------------------------------------------------
INSERT INTO usuarios (id, email, nombre, rol, centro_id)
SELECT id, email, 'Julián Promotor', 'visitador', NULL
  FROM auth.users
 WHERE email = 'visitador@enfoque360.com'
ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol, nombre = EXCLUDED.nombre;

INSERT INTO usuarios (id, email, nombre, rol, centro_id)
SELECT id, email, 'Nelson Gerente', 'gerente', NULL
  FROM auth.users
 WHERE email = 'gerente@enfoque360.com'
ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol, nombre = EXCLUDED.nombre;

-- ---------------------------------------------------------------
-- 2. centros_programa  (5 Bogotá, 3 Cali, 2 Medellín = 10)
-- ---------------------------------------------------------------
INSERT INTO centros_programa (id, nombre, ciudad, regional, incluido_en_programa) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Endocentro Bogotá',           'Bogotá',   'Centro',   true),
  ('c1000000-0000-0000-0000-000000000002', 'IPS La Carolina',             'Bogotá',   'Centro',   true),
  ('c1000000-0000-0000-0000-000000000003', 'Clínica Marly',               'Bogotá',   'Centro',   false),
  ('c1000000-0000-0000-0000-000000000004', 'Hospital El Tunal',           'Bogotá',   'Centro',   false),
  ('c1000000-0000-0000-0000-000000000005', 'Centro Endoscopia Norte',     'Bogotá',   'Centro',   false),
  ('c1000000-0000-0000-0000-000000000006', 'Clínica Imbanaco',            'Cali',     'Pacífico', false),
  ('c1000000-0000-0000-0000-000000000007', 'Centro Médico Valle',         'Cali',     'Pacífico', false),
  ('c1000000-0000-0000-0000-000000000008', 'Fundación Valle del Lili',    'Cali',     'Pacífico', false),
  ('c1000000-0000-0000-0000-000000000009', 'Hospital Pablo Tobón Uribe',  'Medellín', 'Antioquia',false),
  ('c1000000-0000-0000-0000-00000000000a', 'Clínica Las Américas',        'Medellín', 'Antioquia',false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. visitas  (3 completa, 2 en_curso, 3 pendiente = 8)
--    Todas vinculadas al visitador Julián
-- ---------------------------------------------------------------
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM usuarios WHERE email = 'visitador@enfoque360.com';
  IF v_id IS NULL THEN
    RAISE NOTICE 'Visitador no encontrado — saltando seed de visitas';
    RETURN;
  END IF;

  -- Completas
  INSERT INTO visitas (id, visitador_id, centro_id, fecha, estado,
                       medico_lider, procedimientos_mes,
                       travad_pik_pct, travad_colonpeg_pct, otros_pct,
                       top_medicos, historial, visitas_anio)
  VALUES
    ('a1000000-0000-0000-0000-000000000001', v_id,
     'c1000000-0000-0000-0000-000000000001',
     current_date - 5, 'completa',
     'Dr. Mario Rey Tovar', 120, 80, 15, 5,
     '[
        {"nombre":"Dr. Mario Rey Tovar","pct":40,"lider":true},
        {"nombre":"Dr. Juan Pérez","pct":20},
        {"nombre":"Dra. Lucía Mejía","pct":15},
        {"nombre":"Dr. Carlos Vega","pct":15},
        {"nombre":"Dra. Ana Torres","pct":10}
      ]'::jsonb,
     '[
        {"fecha":"2026-01-12","procedimientos":98},
        {"fecha":"2026-02-15","procedimientos":110},
        {"fecha":"2026-03-18","procedimientos":118}
      ]'::jsonb,
     4),
    ('a1000000-0000-0000-0000-000000000002', v_id,
     'c1000000-0000-0000-0000-000000000002',
     current_date - 12, 'completa',
     'Dra. Sandra Gómez', 85, 50, 30, 20,
     '[
        {"nombre":"Dra. Sandra Gómez","pct":35,"lider":true},
        {"nombre":"Dr. Felipe Ríos","pct":25},
        {"nombre":"Dr. Mauricio Salazar","pct":20},
        {"nombre":"Dra. Patricia Núñez","pct":12},
        {"nombre":"Dr. Andrés López","pct":8}
      ]'::jsonb,
     '[{"fecha":"2026-02-10","procedimientos":78},{"fecha":"2026-03-09","procedimientos":82}]'::jsonb,
     3),
    ('a1000000-0000-0000-0000-000000000003', v_id,
     'c1000000-0000-0000-0000-000000000006',
     current_date - 20, 'completa',
     'Dr. Roberto Castaño', 95, 60, 25, 15,
     '[
        {"nombre":"Dr. Roberto Castaño","pct":40,"lider":true},
        {"nombre":"Dra. Marcela Henao","pct":20},
        {"nombre":"Dr. Iván Quintero","pct":15},
        {"nombre":"Dra. Luz Marina Ríos","pct":15},
        {"nombre":"Dr. Esteban Bedoya","pct":10}
      ]'::jsonb,
     '[]'::jsonb,
     2),

  -- En curso
    ('a1000000-0000-0000-0000-000000000004', v_id,
     'c1000000-0000-0000-0000-000000000003',
     current_date - 2, 'en_curso',
     'Dr. Hernán Bohórquez', 0, 0, 0, 0,
     '[]'::jsonb, '[]'::jsonb, 0),
    ('a1000000-0000-0000-0000-000000000005', v_id,
     'c1000000-0000-0000-0000-000000000007',
     current_date - 1, 'en_curso',
     'Dra. Beatriz Moreno', 0, 0, 0, 0,
     '[]'::jsonb, '[]'::jsonb, 0),

  -- Pendientes
    ('a1000000-0000-0000-0000-000000000006', v_id,
     'c1000000-0000-0000-0000-000000000004',
     current_date, 'pendiente',
     NULL, 0, 0, 0, 0, '[]'::jsonb, '[]'::jsonb, 0),
    ('a1000000-0000-0000-0000-000000000007', v_id,
     'c1000000-0000-0000-0000-000000000005',
     current_date, 'pendiente',
     NULL, 0, 0, 0, 0, '[]'::jsonb, '[]'::jsonb, 0),
    ('a1000000-0000-0000-0000-000000000008', v_id,
     'c1000000-0000-0000-0000-000000000009',
     current_date, 'pendiente',
     NULL, 0, 0, 0, 0, '[]'::jsonb, '[]'::jsonb, 0)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------------------------------------------------------------
-- 4. novedades  (5 con tipos/niveles variados)
-- ---------------------------------------------------------------
INSERT INTO novedades (codigo, fecha, tipo, descripcion, centro_programa_id, nivel, responsable, sla_dias, dias_transcurridos, estado, titulo)
VALUES
  ('NOV-2026-101', current_date - 1, 'Calidad',
   'Preparación inadecuada detectada en 3 pacientes consecutivos. Posible falla de entrega del protocolo.',
   'c1000000-0000-0000-0000-000000000001', 'Alto', 'Adriana Mejía', 3, 1, 'Abierta',
   'Preparación inadecuada Endocentro'),
  ('NOV-2026-102', current_date - 4, 'Variación Producto',
   'Lote 2026-A05 de Travad PIK con coloración fuera de especificación. Aislado para análisis.',
   'c1000000-0000-0000-0000-000000000002', 'Medio', 'Calidad TQ', 5, 4, 'En gestión',
   'Lote Travad fuera de especificación'),
  ('NOV-2026-103', current_date - 7, 'Datos',
   'Indicadores de Boston no fueron registrados en 8 procedimientos de la última semana.',
   'c1000000-0000-0000-0000-000000000003', 'Bajo', 'Coordinación Centro', 10, 7, 'En gestión',
   'Datos faltantes Escala Boston'),
  ('NOV-2026-104', current_date - 10, 'Clínica',
   'Médico líder reporta dolor abdominal post-procedimiento mayor al esperado en 2 pacientes.',
   'c1000000-0000-0000-0000-000000000006', 'Alto', 'Dr. Roberto Castaño', 3, 10, 'Cerrada',
   'Eventos adversos Imbanaco'),
  ('NOV-2026-105', current_date - 14, 'Calidad',
   'Tiempo de preparación reportado por debajo del protocolo (menos de 4 horas en ayuno).',
   'c1000000-0000-0000-0000-000000000007', 'Medio', 'Adriana Mejía', 5, 14, 'Cerrada',
   'Protocolo de ayuno no respetado')
ON CONFLICT (codigo) DO NOTHING;
