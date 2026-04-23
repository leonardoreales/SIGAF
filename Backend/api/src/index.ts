import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import assetsRouter    from './interfaces/http/assets.router'
import catalogsRouter  from './interfaces/http/catalogs.router'
import authRouter      from './interfaces/http/auth.router'
import transfersRouter from './interfaces/http/transfers.router'
import historyRouter   from './interfaces/http/history.router'
import reportsRouter   from './interfaces/http/reports.router'
import { errorHandler } from './shared/middleware/error'
import { authenticate } from './shared/middleware/authenticate'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sigaf-api' })
})

app.use('/auth',      authRouter)
app.use('/assets',    authenticate, assetsRouter)
app.use('/catalogs',  authenticate, catalogsRouter)
app.use('/transfers', authenticate, transfersRouter)
app.use('/history',   authenticate, historyRouter)
app.use('/reports',   authenticate, reportsRouter)

app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => {
  console.log(`SIGAF API → http://localhost:${PORT}`)
})
