import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import assetsRouter    from './interfaces/http/assets.router'
import catalogsRouter  from './interfaces/http/catalogs.router'
import authRouter      from './interfaces/http/auth.router'
import syncRouter      from './interfaces/http/sync.router'
import transfersRouter         from './interfaces/http/transfers.router'
import transferRequestsRouter  from './interfaces/http/transferRequests.router'
import usersRouter             from './interfaces/http/users.router'
import historyRouter   from './interfaces/http/history.router'
import reportsRouter   from './interfaces/http/reports.router'
import maintenanceRouter from './interfaces/http/maintenance.router'
import writeoffsRouter   from './interfaces/http/writeoffs.router'
import { errorHandler } from './shared/middleware/error'
import { authenticate } from './shared/middleware/authenticate'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Sync-Secret'],
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sigaf-api' })
})

app.use('/auth',      authRouter)
app.use('/sync',      syncRouter)          // POST /sync/notify (n8n) + GET /sync/events (SSE)
app.use('/assets',    authenticate, assetsRouter)
app.use('/catalogs',  authenticate, catalogsRouter)
app.use('/transfers/requests', authenticate, transferRequestsRouter)
app.use('/transfers',          authenticate, transfersRouter)
app.use('/users',              authenticate, usersRouter)
app.use('/history',   authenticate, historyRouter)
app.use('/reports',   authenticate, reportsRouter)
app.use('/maintenance', authenticate, maintenanceRouter)
app.use('/writeoffs',  authenticate, writeoffsRouter)

app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => {
  console.log(`SIGAF API → http://localhost:${PORT}`)
})
