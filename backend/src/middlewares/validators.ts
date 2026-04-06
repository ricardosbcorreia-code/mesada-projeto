import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Generic validation middleware
 */
export const validate = (schema: z.ZodObject<any, any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((issue) => ({
        message: `${issue.path.join('.')} is ${issue.message}`,
      }));
      res.status(422).json({ error: 'Falha na validação', details: errorMessages });
    } else {
      res.status(500).json({ error: 'Erro interno ao validar dados' });
    }
  }
};

/**
 * Authentication Schemas
 */
export const registerParentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export const loginParentSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const loginChildSchema = z.object({
  parentEmail: z.string().email('Email do responsável inválido'),
  pin: z.string().regex(/^\d{4}$/, 'PIN deve ter exatamente 4 dígitos'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

/**
 * Children Schemas
 */
export const createChildSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  pin: z.string().regex(/^\d{4}$/, 'PIN deve ter exatamente 4 dígitos'),
  base_allowance: z.number().nonnegative('Mesada base não pode ser negativa').optional(),
});

export const updateChildSchema = createChildSchema.partial();

/**
 * Task Schemas
 */
export const createTaskSchema = z.object({
  name: z.string().min(2, 'Nome da tarefa deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  type: z.enum(['SIMPLE', 'CHECKLIST']),
  value: z.number().nonnegative('Valor não pode ser negativo'),
  childIds: z.array(z.string().uuid()).optional(),
  subtasks: z.array(z.string()).optional(),
  recurrence_type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  recurrence_interval: z.number().int().min(1).optional().default(1),
  recurrence_days: z.array(z.number().min(0).max(6)).optional(),
  recurrence_month: z.number().min(1).max(31).nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();
