-- Ativar RLS em todas as tabelas
ALTER TABLE IF EXISTS "parents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "children" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "task_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "task_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "subtasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "subtask_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "reward_redemptions" ENABLE ROW LEVEL SECURITY;

-- Nota: Como o backend usa o usuário 'postgres' (service role) via Prisma,
-- estas políticas protegem contra acesso via API REST do Supabase (PostgREST)
-- se a 'anon' key for comprometida.

-- POLÍTICAS PARA 'PARENTS'
CREATE POLICY "Parents can only see their own profile" 
ON "parents" FOR ALL 
USING (auth.uid()::text = id);

-- POLÍTICAS PARA 'CHILDREN'
CREATE POLICY "Parents can manage their own children" 
ON "children" FOR ALL 
USING (auth.uid()::text = parent_id);

-- POLÍTICAS PARA 'TASKS'
CREATE POLICY "Parents can manage their own tasks" 
ON "tasks" FOR ALL 
USING (auth.uid()::text = parent_id);

-- POLÍTICAS PARA 'TASK_ASSIGNMENTS'
CREATE POLICY "Parents can manage assignments via tasks" 
ON "task_assignments" FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM "tasks" 
    WHERE "tasks".id = "task_assignments".task_id 
    AND "tasks".parent_id = auth.uid()::text
  )
);

-- POLÍTICAS PARA 'TASK_EXECUTIONS'
CREATE POLICY "Parents can manage executions via assignments" 
ON "task_executions" FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM "task_assignments"
    JOIN "tasks" ON "tasks".id = "task_assignments".task_id
    WHERE "task_assignments".id = "task_executions".assignment_id
    AND "tasks".parent_id = auth.uid()::text
  )
);

-- POLÍTICAS PARA 'REWARDS'
CREATE POLICY "Parents can manage their own rewards" 
ON "rewards" FOR ALL 
USING (auth.uid()::text = parent_id);

-- POLÍTICAS PARA 'REWARD_REDEMPTIONS'
CREATE POLICY "Parents can manage redemptions via rewards" 
ON "reward_redemptions" FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM "rewards" 
    WHERE "rewards".id = "reward_redemptions".reward_id 
    AND "rewards".parent_id = auth.uid()::text
  )
);
