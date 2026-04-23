import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export interface GooglePayload {
  sub:     string
  email:   string
  name:    string
  picture: string
}

export async function verifyGoogleToken(idToken: string): Promise<GooglePayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.email) throw new Error('Token de Google inválido')

  return {
    sub:     payload.sub,
    email:   payload.email,
    name:    payload.name    ?? '',
    picture: payload.picture ?? '',
  }
}
