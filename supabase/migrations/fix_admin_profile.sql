-- 1. Criar departamento e setor padrão
INSERT INTO departments (name) 
VALUES ('Administração') 
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Anote o UUID retornado acima e use nos próximos comandos

-- 2. Criar setor (substitua DEPT_UUID_AQUI pelo UUID do departamento)
INSERT INTO sectors (name, department_id) 
VALUES ('Geral', 'DEPT_UUID_AQUI')
RETURNING id;

-- 3. Atualizar perfil admin (substitua os UUIDs e o EMAIL)
UPDATE profiles 
SET 
  department_id = 'DEPT_UUID_AQUI',
  sector_id = 'SECTOR_UUID_AQUI',
  role = 'admin'
WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com';

-- OU se preferir fazer tudo de uma vez (mais fácil):
WITH dept AS (
  INSERT INTO departments (name) 
  VALUES ('Administração') 
  ON CONFLICT (name) DO UPDATE SET name = 'Administração'
  RETURNING id
),
sect AS (
  INSERT INTO sectors (name, department_id) 
  SELECT 'Geral', id FROM dept
  ON CONFLICT DO NOTHING
  RETURNING id
)
UPDATE profiles 
SET 
  department_id = (SELECT id FROM dept),
  sector_id = (SELECT id FROM sect),
  role = 'admin'
WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com';  -- SUBSTITUA AQUI

-- Verificar se funcionou
SELECT id, name, email, role, department_id, sector_id 
FROM profiles 
WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com';  -- SUBSTITUA AQUI
