import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { loginWithGoogle } from '../../application/auth/loginWithGoogle'

const router = Router()

router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await loginWithGoogle(req.body))
  } catch (err) { next(err) }
})

export default router
