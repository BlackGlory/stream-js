import { server } from '@test/stream-client.mock.js'
import { StreamClient, StreamNotFound, StreamLocked } from '@src/stream-client.js'
import { getErrorPromise } from 'return-style'
import { Readable } from 'stream'
import { text } from 'stream/consumers'
import { ReadableStream, toAsyncIterableIterator } from 'extra-stream'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('StreamClient', () => {
  describe('createStream', () => {
    test('locked', async () => {
      const client = createClient()

      const err = await getErrorPromise(client.createStream('locked', {
        timeToLive: null
      }))

      expect(err).toBeInstanceOf(StreamLocked)
    })

    test('unlocked', async () => {
      const client = createClient()

      await client.createStream('unlocked', {
        timeToLive: null
      })
    })
  })

  describe('writeStream', () => {
    test('not found', async () => {
      const client = createClient()

      const err = await getErrorPromise(
        client.writeStream('not-found', Readable.from('data'))
      )

      expect(err).toBeInstanceOf(StreamNotFound)
    })

    test('locked', async () => {
      const client = createClient()

      const err = await getErrorPromise(
        client.writeStream('locked', Readable.from('data'))
      )

      expect(err).toBeInstanceOf(StreamLocked)
    })

    test('unlocked', async () => {
      const client = createClient()

      await client.writeStream('unlocked', Readable.from('data'))
    })
  })

  describe('readStream', () => {
    test('not found', async () => {
      const client = createClient()

      const err = await getErrorPromise(client.readStream('not-found'))

      expect(err).toBeInstanceOf(StreamNotFound)
    })

    test('locked', async () => {
      const client = createClient()

      const err = await getErrorPromise(client.readStream('locked'))

      expect(err).toBeInstanceOf(StreamLocked)
    })

    test('unlocked', async () => {
      const client = createClient()

      const result = await client.readStream('unlocked')

      expect(result).toBeInstanceOf(ReadableStream)
      expect(await text(toAsyncIterableIterator(result))).toBe('data')
    })
  })
})

function createClient() {
  return new StreamClient({ server: 'http://localhost' })
}
