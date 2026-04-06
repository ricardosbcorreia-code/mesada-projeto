import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes (login, register, child-login)
 * Limits to 10 requests per 15 minutes window
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for refresh token route
 * Slightly more generous: 20 requests per 15 minutes
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests
  message: { error: 'Muitas tentativas de atualização de token.' },
  standardHeaders: true,
  legacyHeaders: false,
});
