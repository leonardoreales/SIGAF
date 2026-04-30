import type { Response } from 'express'

class SseManager {
  private readonly clients = new Set<Response>()

  connect(res: Response): void {
    res.setHeader('Content-Type',      'text/event-stream')
    res.setHeader('Cache-Control',     'no-cache')
    res.setHeader('Connection',        'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    this.clients.add(res)
    res.on('close', () => this.clients.delete(res))
  }

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const client of this.clients) {
      try {
        client.write(payload)
      } catch {
        this.clients.delete(client)
      }
    }
  }

  get connectedCount(): number {
    return this.clients.size
  }
}

export const sseManager = new SseManager()
