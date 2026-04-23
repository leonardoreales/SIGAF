import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error:  'VALIDATION_ERROR',
      issues: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error:   err.code ?? 'APP_ERROR',
      message: err.message,
    })
    return
  }

  console.error('[SIGAF]', err)
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor' })
}
