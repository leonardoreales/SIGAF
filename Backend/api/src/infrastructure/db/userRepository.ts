import { eq } from 'drizzle-orm'
import { db } from './client'
import { systemUsers } from './schema'

export type SystemUserRow = typeof systemUsers.$inferSelect

export async function findByEmail(email: string): Promise<SystemUserRow | null> {
  const rows = await db.select().from(systemUsers).where(eq(systemUsers.email, email)).limit(1)
  return rows[0] ?? null
}

export async function findAll(): Promise<SystemUserRow[]> {
  return db.select().from(systemUsers).orderBy(systemUsers.role, systemUsers.email)
}

export async function upsertLogin(email: string, name: string): Promise<SystemUserRow> {
  const rows = await db
    .insert(systemUsers)
    .values({ email, name })
    .onConflictDoUpdate({
      target: systemUsers.email,
      set: {
        name,
        lastLoginAt: new Date(),
        updatedAt:   new Date(),
      },
    })
    .returning()
  return rows[0]
}

export async function updateUser(
  email: string,
  data: Partial<Pick<SystemUserRow, 'role' | 'cargo' | 'dependencia' | 'isActive'>>,
): Promise<SystemUserRow | null> {
  const rows = await db
    .update(systemUsers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(systemUsers.email, email))
    .returning()
  return rows[0] ?? null
}
