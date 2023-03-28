import { fetch } from 'extra-fetch'
import { get, IRequestOptionsTransformer, post, put } from 'extra-request'
import { url, appendPathname, signal, keepalive, basicAuth, header, json, body } from 'extra-request/transformers'
import { ok } from 'extra-response'
import { timeoutSignal, raceAbortSignals } from 'extra-abort'
import { expectedVersion } from './utils.js'
import { Falsy, JSONObject } from 'justypes'
import { NotFound, Conflict } from '@blackglory/http-status'
import { assert, CustomError } from '@blackglory/errors'
import { isNodeJSReadableStream, toReadableStream } from 'extra-stream'
import { isntNull, go } from '@blackglory/prelude'

export interface IStreamConfiguration extends JSONObject {
  timeToLive: number | null
}

export interface IStreamClientOptions {
  server: string
  basicAuth?: {
    username: string
    password: string
  }
  keepalive?: boolean
  timeout?: number
}

export interface IStreamClientRequestOptions {
  signal?: AbortSignal
  keepalive?: boolean
  timeout?: number | false
}

export class StreamLocked extends CustomError {}
export class StreamNotFound extends CustomError {}

export class StreamClient {
  constructor(private options: IStreamClientOptions) {}

  /**
   * @throws {StreamLocked}
   */
  async createStream(
    id: string
  , config: IStreamConfiguration
  , options: IStreamClientRequestOptions = {}
  ): Promise<void> {
    const req = put(
      ...this.getCommonTransformers(options)
    , appendPathname(`/streams/${id}`)
    , json(config)
    )

    try {
      await fetch(req).then(ok)
    } catch (e) {
      if (e instanceof Conflict) throw new StreamLocked()
    }
  }

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  async readStream(
    id: string
  , options: IStreamClientRequestOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const req = get(
      ...this.getCommonTransformers(options)
    , appendPathname(`/streams/${id}`)
    )

    try {
      const res = await fetch(req).then(ok)
      assert(isntNull(res.body), 'The response has no body')

      if (isNodeJSReadableStream(res.body)) {
        return toReadableStream(go(
          async function* (): AsyncIterableIterator<Uint8Array> {
            for await (const chunk of res.body as unknown as NodeJS.ReadableStream) {
              yield new Uint8Array(Buffer.from(chunk))
            }
          }
        ))
      } else {
        return res.body
      }
    } catch (e) {
      if (e instanceof NotFound) throw new StreamNotFound(e.message)
      if (e instanceof Conflict) throw new StreamLocked(e.message)

      throw e
    }
  }

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  async writeStream(
    id: string
  , payload: NodeJS.ReadableStream | ReadableStream
  , options: IStreamClientRequestOptions = {}
  ): Promise<void> {
    const req = post(
      ...this.getCommonTransformers(options)
    , appendPathname(`/streams/${id}`)
    , header('Content-Type', 'application/octet-stream')
    , body(payload)
    )

    try {
      await fetch(req).then(ok)
    } catch (e) {
      if (e instanceof NotFound) throw new StreamNotFound(e.message)
      if (e instanceof Conflict) throw new StreamLocked(e.message)

      throw e
    }
  }

  private getCommonTransformers(
    options: IStreamClientRequestOptions
  ): Array<IRequestOptionsTransformer | Falsy> {
    const auth = this.options.basicAuth

    return [
      url(this.options.server)
    , auth && basicAuth(auth.username, auth.password)
    , signal(raceAbortSignals([
        options.signal
      , options.timeout !== false && (
          (options.timeout && timeoutSignal(options.timeout)) ??
          (this.options.timeout && timeoutSignal(this.options.timeout))
        )
      ]))
    , (options.keepalive ?? this.options.keepalive) && keepalive()
    , header('Accept-Version', expectedVersion)
    ]
  }
}
