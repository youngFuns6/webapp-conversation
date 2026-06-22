import { API_PREFIX } from '@/config'
import Toast from '@/app/components/base/toast'
import { CHAT_MODE_HEADER, getChatMode } from '@/service/chat-mode'
import type { AnnotationReply, MessageEnd, MessageReplace, ThoughtItem } from '@/app/components/chat/type'
import type { VisionFile } from '@/types/app'

const TIME_OUT = 100000

const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // for download
}

function createRequestHeaders(contentType = ContentType.json): Headers {
  return new Headers({
    'Content-Type': contentType,
    [CHAT_MODE_HEADER]: getChatMode(),
  })
}

const baseOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include' as RequestCredentials,
  redirect: 'follow' as RequestRedirect,
}

export interface WorkflowStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    sequence_number: number
    created_at: number
  }
}

export interface WorkflowFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: any
    error: string
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number
    finished_at: number
  }
}

export interface NodeStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    created_at: number
    extras?: any
  }
}

export interface NodeFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    process_data: any
    outputs: any
    status: string
    error: string
    elapsed_time: number
    execution_metadata: {
      total_tokens: number
      total_price: number
      currency: string
    }
    created_at: number
  }
}

export interface IOnDataMoreInfo {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void
export type IOnThought = (though: ThoughtItem) => void
export type IOnFile = (file: VisionFile) => void
export type IOnMessageEnd = (messageEnd: MessageEnd) => void
export type IOnMessageReplace = (messageReplace: MessageReplace) => void
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void
export type IOnCompleted = (hasError?: boolean) => void
export type IOnError = (msg: string, code?: string) => void
export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void

interface IOtherOptions {
  isPublicAPI?: boolean
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  onData?: IOnData // for stream
  onThought?: IOnThought
  onFile?: IOnFile
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  onError?: IOnError
  onCompleted?: IOnCompleted // for stream
  getAbortController?: (abortController: AbortController) => void
  onWorkflowStarted?: IOnWorkflowStarted
  onWorkflowFinished?: IOnWorkflowFinished
  onNodeStarted?: IOnNodeStarted
  onNodeFinished?: IOnNodeFinished
}

function unicodeToChar(text: string) {
  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
}

function extractStreamText(bufferObj: Record<string, any>): string {
  if (typeof bufferObj.answer === 'string')
  { return unicodeToChar(bufferObj.answer) }

  if (typeof bufferObj.text === 'string')
  { return unicodeToChar(bufferObj.text) }

  if (typeof bufferObj.data?.text === 'string')
  { return unicodeToChar(bufferObj.data.text) }

  return ''
}

function handleStreamEvent(
  bufferObj: Record<string, any>,
  callbacks: {
    onData: IOnData
    onThought?: IOnThought
    onFile?: IOnFile
    onMessageEnd?: IOnMessageEnd
    onMessageReplace?: IOnMessageReplace
    onWorkflowStarted?: IOnWorkflowStarted
    onWorkflowFinished?: IOnWorkflowFinished
    onNodeStarted?: IOnNodeStarted
    onNodeFinished?: IOnNodeFinished
    isFirstMessage: { value: boolean }
  },
): boolean {
  const {
    onData,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    isFirstMessage,
  } = callbacks

  const baseInfo = {
    conversationId: bufferObj.conversation_id,
    taskId: bufferObj.task_id,
    messageId: bufferObj.id || bufferObj.message_id || '',
  }

  if (bufferObj.event === 'message' || bufferObj.event === 'agent_message' || bufferObj.event === 'text_chunk') {
    const text = extractStreamText(bufferObj)
    if (text) {
      onData(text, isFirstMessage.value, baseInfo)
      isFirstMessage.value = false
    }
    return false
  }

  if (bufferObj.event === 'agent_thought') {
    onThought?.(bufferObj as ThoughtItem)
  }
  else if (bufferObj.event === 'message_file') {
    onFile?.(bufferObj as VisionFile)
  }
  else if (bufferObj.event === 'message_end') {
    onMessageEnd?.(bufferObj as MessageEnd)
  }
  else if (bufferObj.event === 'message_replace') {
    onMessageReplace?.(bufferObj as MessageReplace)
  }
  else if (bufferObj.event === 'workflow_started') {
    onWorkflowStarted?.(bufferObj as WorkflowStartedResponse)
  }
  else if (bufferObj.event === 'workflow_finished') {
    onWorkflowFinished?.(bufferObj as WorkflowFinishedResponse)
  }
  else if (bufferObj.event === 'node_started') {
    onNodeStarted?.(bufferObj as NodeStartedResponse)
  }
  else if (bufferObj.event === 'node_finished') {
    onNodeFinished?.(bufferObj as NodeFinishedResponse)
  }

  return false
}

const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
) => {
  if (!response.ok) { throw new Error('Network response was not ok') }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  const isFirstMessage = { value: true }

  function read() {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted()
        return
      }
      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      try {
        for (const message of lines) {
          if (!message.startsWith('data: '))
          { continue }

          let bufferObj: Record<string, any>
          try {
            bufferObj = JSON.parse(message.substring(6)) as Record<string, any>
          }
          catch {
            continue
          }

          if (bufferObj.status === 400 || (!bufferObj.event && bufferObj.message)) {
            onData('', false, {
              conversationId: undefined,
              messageId: '',
              errorMessage: bufferObj?.message,
              errorCode: bufferObj?.code,
            })
            hasError = true
            onCompleted?.(true)
            return
          }

          const eventHasError = handleStreamEvent(bufferObj, {
            onData,
            onThought,
            onFile,
            onMessageEnd,
            onMessageReplace,
            onWorkflowStarted,
            onWorkflowFinished,
            onNodeStarted,
            onNodeFinished,
            isFirstMessage,
          })
          if (eventHasError) {
            hasError = true
            return
          }
        }
      }
      catch (e) {
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        })
        hasError = true
        onCompleted?.(true)
        return
      }
      if (!hasError)
      { read() }
    })
  }
  read()
}

const baseFetch = (url: string, fetchOptions: any, { needAllResponseContent, deleteContentType }: IOtherOptions) => {
  const options = Object.assign({}, baseOptions, fetchOptions)
  const contentType = deleteContentType
    ? ContentType.download
    : (fetchOptions.headers?.get?.('Content-type') || ContentType.json)
  options.headers = createRequestHeaders(contentType)

  const urlPrefix = API_PREFIX

  let urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options
  // handle query
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach(key =>
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`),
    )
    if (urlWithPrefix.search(/\?/) === -1) { urlWithPrefix += `?${paramsArray.join('&')}` }

    else { urlWithPrefix += `&${paramsArray.join('&')}` }

    delete options.params
  }

  if (body) { options.body = JSON.stringify(body) }

  // Handle timeout
  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('request timeout'))
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis.fetch(urlWithPrefix, options)
        .then((res: any) => {
          const resClone = res.clone()
          // Error handler
          if (!/^(2|3)\d{2}$/.test(res.status)) {
            try {
              const bodyJson = res.json()
              switch (res.status) {
                case 401: {
                  Toast.notify({ type: 'error', message: 'Invalid token' })
                  return
                }
                default:
                  // eslint-disable-next-line no-new
                  new Promise(() => {
                    bodyJson.then((data: any) => {
                      Toast.notify({ type: 'error', message: data.message })
                    })
                  })
              }
            }
            catch (e) {
              Toast.notify({ type: 'error', message: `${e}` })
            }

            return Promise.reject(resClone)
          }

          // handle delete api. Delete api not return content.
          if (res.status === 204) {
            resolve({ result: 'success' })
            return
          }

          // return data
          const data = options.headers.get('Content-type') === ContentType.download ? res.blob() : res.json()

          resolve(needAllResponseContent ? resClone : data)
        })
        .catch((err) => {
          Toast.notify({ type: 'error', message: err })
          reject(err)
        })
    }),
  ])
}

export const upload = (fetchOptions: any): Promise<any> => {
  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}/file-upload`
  const defaultOptions = {
    method: 'POST',
    url: `${urlWithPrefix}`,
    data: {},
  }
  const options = {
    ...defaultOptions,
    ...fetchOptions,
  }
  return new Promise((resolve, reject) => {
    const xhr = options.xhr
    xhr.open(options.method, options.url)
    xhr.setRequestHeader(CHAT_MODE_HEADER, getChatMode())
    for (const key in options.headers) { xhr.setRequestHeader(key, options.headers[key]) }

    xhr.withCredentials = true
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) { resolve({ id: xhr.response }) }
        else { reject(xhr) }
      }
    }
    xhr.upload.onprogress = options.onprogress
    xhr.send(options.data)
  })
}

export const ssePost = (
  url: string,
  fetchOptions: any,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    onError,
  }: IOtherOptions,
) => {
  const options = Object.assign({}, baseOptions, {
    method: 'POST',
    headers: createRequestHeaders(ContentType.json),
  }, fetchOptions)
  options.headers = createRequestHeaders(ContentType.json)

  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { body } = options
  if (body) { options.body = JSON.stringify(body) }

  globalThis.fetch(urlWithPrefix, options)
    .then((res: any) => {
      if (!/^(2|3)\d{2}$/.test(res.status)) {
        // eslint-disable-next-line no-new
        new Promise(() => {
          res.json().then((data: any) => {
            Toast.notify({ type: 'error', message: data.message || 'Server Error' })
          })
        })
        onError?.('Server Error')
        return
      }
      return handleStream(res, (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
        if (moreInfo.errorMessage) {
          Toast.notify({ type: 'error', message: moreInfo.errorMessage })
          return
        }
        onData?.(str, isFirstMessage, moreInfo)
      }, () => {
        onCompleted?.()
      }, onThought, onMessageEnd, onMessageReplace, onFile, onWorkflowStarted, onWorkflowFinished, onNodeStarted, onNodeFinished)
    })
    .catch((e) => {
      Toast.notify({ type: 'error', message: e })
      onError?.(e)
    })
}

export const request = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return baseFetch(url, options, otherOptions || {})
}

export const get = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'GET' }), otherOptions)
}

export const post = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'POST' }), otherOptions)
}

export const put = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'PUT' }), otherOptions)
}

export const del = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'DELETE' }), otherOptions)
}
