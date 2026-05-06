import jwt from 'jsonwebtoken'
import { GoogleLoginSchema } from '@sigaf/shared'
import { verifyGoogleToken } from '../../infrastructure/auth/googleVerifier'
import { upsertLogin } from '../../infrastructure/db/userRepository'
import { ValidationError } from '../../shared/errors'

const ALLOWED_DOMAIN = 'americana.edu.co'

export async function loginWithGoogle(rawBody: unknown) {
  const { idToken } = GoogleLoginSchema.parse(rawBody)

  const googleUser = await verifyGoogleToken(idToken)

  const email = googleUser.email.toLowerCase()
  const domain = email.split('@')[1]
  if (domain !== ALLOWED_DOMAIN) {
    throw new ValidationError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}`)
  }

  // Upsert: registra name + last_login_at; si es nuevo → VIEWER por defecto
  const userRecord = await upsertLogin(email, googleUser.name)

  const token = jwt.sign(
    {
      sub:         email,
      email:       email,
      name:        googleUser.name,
      picture:     googleUser.picture,
      role:        userRecord.role,
      cargo:       userRecord.cargo,
      dependencia: userRecord.dependencia,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as jwt.SignOptions['expiresIn'] },
  )

  return {
    token,
    user: {
      email:       email,
      name:        googleUser.name,
      picture:     googleUser.picture,
      role:        userRecord.role,
      cargo:       userRecord.cargo,
      dependencia: userRecord.dependencia,
    },
  }
}
