import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors'

export interface AuthUser {
  sub:     string
  email:   string
  name:    string
  picture: string
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token requerido', 'UNAUTHORIZED'))
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    res.locals.user = payload
    next()
  } catch {
    next(new AppError(401, 'Token inválido o expirado', 'UNAUTHORIZED'))
  }
}
