import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors'

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user
    if (!user || !roles.includes(user.role)) {
      return next(new AppError(403, 'Acceso denegado', 'FORBIDDEN'))
    }
    next()
  }
}
