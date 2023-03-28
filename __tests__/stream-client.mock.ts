import { setupServer } from 'msw/node'
import { rest } from 'msw'

export const server = setupServer(
  rest.put('/streams/locked', (req, res, ctx) => {
    return res(ctx.status(409))
  })
, rest.put('/streams/unlocked', async (req, res, ctx) => {
    expect(await req.json()).toStrictEqual({ timeToLive: null })

    return res(ctx.status(204))
  })

, rest.post('/streams/not-found', async (req, res, ctx) => {
    return res(ctx.status(404))
  })
, rest.post('/streams/locked', async (req, res, ctx) => {
    return res(ctx.status(409))
  })
, rest.post('/streams/unlocked', async (req, res, ctx) => {
    expect(req.headers.get('content-type')).toBe('application/octet-stream')
    expect(await req.text()).toBe('data')

    return res(ctx.status(204))
  })

, rest.get('/streams/not-found', async (req, res, ctx) => {
    return res(ctx.status(404))
  })
, rest.get('/streams/locked', async (req, res, ctx) => {
    return res(ctx.status(409))
  })
, rest.get('/streams/unlocked', async (req, res, ctx) => {
    return res(
      ctx.status(200)
    , ctx.set('content-type', 'application/octet-stream')
    , ctx.body('data')
    )
  })
)
