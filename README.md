# stream-js
## Install
```sh
npm install --save @blackglory/stream-js
# or
yarn add @blackglory/stream-js
```

## API
### StreamClient
```ts
interface IStreamConfiguration extends JSONObject {
  timeToLive: number | null
}

interface IStreamClientOptions {
  server: string
  basicAuth?: {
    username: string
    password: string
  }
  keepalive?: boolean
  timeout?: number
}

interface IStreamClientRequestOptions {
  signal?: AbortSignal
  keepalive?: boolean
  timeout?: number | false
}

class StreamLocked extends CustomError {}
class StreamNotFound extends CustomError {}

class StreamClient {
  constructor(options: IStreamClientOptions)

  /**
   * @throws {StreamLocked}
   */
  createStream(
    id: string
  , config: IStreamConfiguration
  , options?: IStreamClientRequestOptions
  ): Promise<void>

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  readStream(
    id: string
  , options?: IStreamClientRequestOptions
  ): Promise<ReadableStream<Uint8Array>>

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  writeStream(
    id: string
  , payload: NodeJS.ReadableStream | ReadableStream
  , options?: IStreamClientRequestOptions
  ): Promise<void>
}
```
