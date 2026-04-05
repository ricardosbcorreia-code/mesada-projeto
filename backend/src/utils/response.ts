import { Response } from 'express';

/**
 * Sends a standardized error response.
 */
export const sendError = (res: Response, status: number, message: string): void => {
  res.status(status).json({ error: message });
};

/**
 * Sends a standardized success response.
 */
export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json(data);
};
