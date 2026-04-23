import jwt from 'jsonwebtoken'
import { GoogleLoginSchema } from '@sigaf/shared'
import { verifyGoogleToken } from '../../infrastructure/auth/googleVerifier'
import { ValidationError } from '../../shared/errors'

const ALLOWED_DOMAIN = 'americana.edu.co'

export async function loginWithGoogle(rawBody: unknown) {
  const { idToken } = GoogleLoginSchema.parse(rawBody)

  const googleUser = await verifyGoogleToken(idToken)

  const domain = googleUser.email.split('@')[1]
  if (domain !== ALLOWED_DOMAIN) {
    throw new ValidationError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}`)
  }

  const token = jwt.sign(
    {
      sub:     googleUser.email,
      email:   googleUser.email,
      name:    googleUser.name,
      picture: googleUser.picture,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as jwt.SignOptions['expiresIn'] },
  )

  return {
    token,
    user: {
      email:   googleUser.email,
      name:    googleUser.name,
      picture: googleUser.picture,
    },
  }
}
