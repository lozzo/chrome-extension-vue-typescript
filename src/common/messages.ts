import { EventEmitter } from './event'
import { getCurrentTabId } from './utils'

const BACKGROUNDJS = 'backgroundJs'
const CONTENTJS = 'contentJs'
const INJECTJS = 'injectJs'
const DEVTOOLSJS = 'devtoolsJs'
const POPUPJS = 'popupJs'
export type MsgType = typeof BACKGROUNDJS | typeof CONTENTJS | typeof INJECTJS | typeof DEVTOOLSJS | typeof POPUPJS

// 这玩意儿大家自己搞一个，别写成一样的了，如果用到这玩意儿了，消息就乱套了
const TOKEN = 'dknf;dhgfc6rtdiycvkugdta4aoi;hpu0[jkbi786gh@OI#das'
const WHATISMYTABID = 'what is my tabID?'

interface MessageProtocol<T, U> {
  token: string
  to: MsgType
  toTabID?: number
  from: MsgType
  fromTabID?: number
  reply: boolean
  InjectRedict?: boolean
  method: T
  messageID: number
  data: U
  error?: any
}

interface CallbackItem<K> {
  reject: Function
  resolve: Function
  method: K
}

export interface Imsg<T, R> {
  req: T
  resp: R
}

/**
 * 范型参数确定消息的类型
 * @param type 消息的类型，不同的脚本需要使用各自对应的类型
 */
export async function getMsgSender<T extends Record<keyof T, Imsg<any, any>>>(
  type: MsgType
): Promise<MessageSender<T>> {
  switch (type) {
    case INJECTJS: {
      return new InjectJsMessageSender<T>()
    }
    case CONTENTJS: {
      return await ContentJsMessageSender.creat<T>()
    }
    case BACKGROUNDJS: {
      return new BackgroundMessageSender<T>()
    }
    case DEVTOOLSJS: {
      return await DevtoolsMessageSender.creat<T>()
    }
    case POPUPJS: {
      return await PopupMessageSender.creat<T>()
    }
  }
}

export interface MessageSender<Q extends Record<keyof Q, Imsg<any, any>>> extends EventEmitter {
  emit<K extends keyof Q>(event: K, data: MessageProtocol<K, Q[K]['req']>, echo: (data: Q[K]['resp']) => void): boolean

  /**
   *
   * @param envent 消息事件，即method
   * @param listener 回调函数
   */
  on<K extends keyof Q>(
    envent: K,
    listener: (data: MessageProtocol<K, Q[K]['req']>, echo: (data: Q[K]['resp']) => void) => void
  ): this
}

export class MessageSender<Q extends Record<keyof Q, Imsg<any, any>>> extends EventEmitter {
  public tabID?: number
  private messageID: number = 0
  public type: MsgType = INJECTJS
  private callBacks = new Map<number, CallbackItem<keyof Q>>()
  constructor() {
    super()
  }
  protected _send<K extends keyof Q>(msg: MessageProtocol<K, Q[K]['req']>) {
    throw new Error(`需要子类来实现这个方法`)
  }
  onMessage<K extends keyof Q>(msg: MessageProtocol<K, Q[K]['resp'] | Q[K]['req']>) {
    if (msg.reply) {
      this.handleReply(msg)
    } else {
      const method = msg.method
      this.emit(method, msg, (data: Q[K]['resp']) => {
        this.reply(msg, method, data)
      })
    }
  }
  sendEvent<K extends keyof Q>(msg: MessageProtocol<K, Q[K]['req']>): Promise<Q[K]['resp']> {
    this._send(msg)
    return new Promise((resolve, reject) => {
      this.callBacks.set(msg.messageID!, { resolve, reject, method: msg.method! })
    })
  }
  reply<K extends keyof Q, P extends keyof Q>(
    msg: MessageProtocol<K, Q[K]['resp']>,
    method: P,
    result: Q[P]['req'] = null,
    error: any = null
  ) {
    const data = {
      token: TOKEN,
      from: msg.to,
      fromTabID: msg.toTabID,
      reply: true,
      to: msg.from,
      toTabID: msg.fromTabID,
      method: method,
      data: result,
      error: error,
      messageID: msg.messageID
    }
    this._send(data)
  }

  handleReply<K extends keyof Q>(msg: MessageProtocol<K, Q[K]['resp']['data']>) {
    const id = msg.messageID
    const error = msg.error
    const callback = this.callBacks.get(id)
    if (callback) {
      this.callBacks.delete(id)
      if (error) {
        callback.reject(new Error(`Protocol error (${callback.method}): ${error.message} ${error.data}`))
      } else {
        callback.resolve(msg.data)
      }
    }
  }

  genMessageProtocol<K extends keyof Q>(
    msgData: Q[K]['req'],
    method: K,
    to: MsgType,
    tabID?: number
  ): MessageProtocol<K, Q[K]['req']> {
    return {
      token: TOKEN,
      from: this.type,
      fromTabID: this.tabID,
      reply: false,
      to: to,
      toTabID: tabID === undefined ? this.tabID : tabID,
      method: method,
      messageID: this.messageID++,
      data: msgData
    }
  }

  sendEventToContentJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number) {
    const data = this.genMessageProtocol(msgData, method, CONTENTJS, toTabID)
    this._send(data)
  }
  sendMsgToContentJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number): Promise<Q[K]['resp']> {
    const data = this.genMessageProtocol(msgData, method, CONTENTJS, toTabID)
    return this.sendEvent(data)
  }

  sendEventToDevtoolJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number) {
    const data = this.genMessageProtocol(msgData, method, DEVTOOLSJS, toTabID)
    this._send(data)
  }

  sendMsgToDevtoolJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number): Promise<Q[K]['resp']> {
    const data = this.genMessageProtocol(msgData, method, DEVTOOLSJS, toTabID)
    return this.sendEvent(data)
  }

  sendEventToPopupJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number) {
    const data = this.genMessageProtocol(msgData, method, POPUPJS, toTabID)
    this._send(data)
  }
  sendMsgToPopupJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number): Promise<Q[K]['resp']> {
    const data = this.genMessageProtocol(msgData, method, POPUPJS, toTabID)
    return this.sendEvent(data)
  }

  sendEventToBackgroundJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number) {
    const data = this.genMessageProtocol(msgData, method, BACKGROUNDJS, toTabID)
    this._send(data)
  }

  sendMsgToBackgroundJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number): Promise<Q[K]['resp']> {
    const data = this.genMessageProtocol(msgData, method, BACKGROUNDJS, toTabID)
    return this.sendEvent(data)
  }

  sendEventToInjectJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number) {
    const data = this.genMessageProtocol(msgData, method, INJECTJS, toTabID)
    this._send(data)
  }

  sendMsgToInjectJS<K extends keyof Q>(method: K, msgData: Q[K]['req'], toTabID?: number): Promise<Q[K]['resp']> {
    const data = this.genMessageProtocol(msgData, method, INJECTJS, toTabID)
    return this.sendEvent(data)
  }
}

class InjectJsMessageSender<T extends Record<keyof T, Imsg<any, any>>> extends MessageSender<T> {
  constructor() {
    super()
    this.type = INJECTJS
    console.log('injectJs Message sender init ok')
    window.addEventListener('message', this._onEventMessage.bind(this))
  }
  _onEventMessage(event: MessageEvent) {
    this.onMessage(event.data)
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    window.postMessage(msg, '*')
  }
}

class ContentJsMessageSender<T extends Record<keyof T, Imsg<any, any>>> extends MessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(toBackGroundPort: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = toBackGroundPort
    this.tabID = tabID
    this.type = CONTENTJS
    window.addEventListener('message', this._onEventMessage.bind(this))
    toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }
  static async creat<T extends Record<keyof T, Imsg<any, any>>>() {
    const tabID = await ContentJsMessageSender.getTabID()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${CONTENTJS}-${tabID}`
    })
    // toBackGroundPort.postMessage(WHATISMYTABID)
    return new ContentJsMessageSender<T>(toBackGroundPort, tabID)
  }

  static async getTabID(): Promise<number> {
    return new Promise((resolve, reject) => {
      const queryTabIDPort = chrome.runtime.connect({ name: WHATISMYTABID })
      queryTabIDPort.onMessage.addListener((msg) => {
        queryTabIDPort.disconnect()
        resolve(msg as number)
      })
    })
  }
  protected _send<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    if (msg.to === INJECTJS) {
      window.postMessage(msg, '*')
      return
    }
    this.toBackGroundPort.postMessage(msg)
  }
  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    if (msg.token !== TOKEN) return
    // 给injectjs发出的消息添加发出tabID
    if (msg.from === INJECTJS) {
      msg.fromTabID = this.tabID
      // msg.toTabID = this.tabID;
    }
    if (msg.to === CONTENTJS) {
      this.onMessage(msg)
    } else {
      this.redictMessage(msg)
    }
  }
  redictMessage<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    if (msg.to === INJECTJS) {
      // 这个是用来区分发送到injectsjs的标志，应为他俩都监听了message事件
      msg.InjectRedict = true
    }
    this._send(msg)
  }

  _onEventMessage<K extends keyof T>(event: MessageEvent) {
    const msg = event.data as MessageProtocol<K, T[K]['req']>
    // injectJs才会处理
    if (msg.InjectRedict) return
    this._onMessage(msg)
  }
}

class BackgroundMessageSender<T extends Record<keyof T, Imsg<any, any>>> extends MessageSender<T> {
  private devtoolsPorts: Map<number, chrome.runtime.Port>
  private contentJsPorts: Map<number, chrome.runtime.Port>
  private popupPorts: Map<number, chrome.runtime.Port>
  private onConnect: Function
  constructor() {
    super()
    this.devtoolsPorts = new Map<number, chrome.runtime.Port>()
    this.contentJsPorts = new Map<number, chrome.runtime.Port>()
    this.popupPorts = new Map<number, chrome.runtime.Port>()
    this.onConnect = (port: chrome.runtime.Port) => {
      if (port.name === WHATISMYTABID) {
        const tabID = port.sender!.tab!.id!
        port.postMessage(tabID)
        return
      }
      const info = port.name.split('-')
      const ID = parseInt(info[1])
      const _type = info[0]
      const _map = _type === DEVTOOLSJS ? this.devtoolsPorts : _type === POPUPJS ? this.popupPorts : this.contentJsPorts
      _map.set(ID, port)
      port.onMessage.addListener(this._onMessage.bind(this))
      port.onDisconnect.addListener(this.onProtDisconnect.bind(this))
    }
    chrome.runtime.onConnect.addListener(this.onConnect.bind(this))
  }

  onProtDisconnect(port: chrome.runtime.Port) {
    const info = port.name.split('-')
    const ID = parseInt(info[1])
    const _type = info[0]
    const _map = _type === DEVTOOLSJS ? this.devtoolsPorts : _type === POPUPJS ? this.popupPorts : this.contentJsPorts
    _map.delete(ID)
  }

  _send<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    const _map = msg.to === DEVTOOLSJS ? this.devtoolsPorts : msg.to === POPUPJS ? this.popupPorts : this.contentJsPorts
    const port = _map.get(msg.toTabID || -1)
    if (!port) {
      console.log('没有获取到对应的port')
      return
    }
    port.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    if (msg.token !== TOKEN) return
    if (msg.to !== BACKGROUNDJS) {
      this._send(msg)
    }
    this.onMessage(msg)
  }
}

/**
 * devTools的消息处理机制
 */
class DevtoolsMessageSender<T extends Record<keyof T, Imsg<any, any>>> extends MessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(port: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = port
    this.tabID = tabID
    this.type = DEVTOOLSJS
    this.toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }

  static async creat<T extends Record<keyof T, Imsg<any, any>>>() {
    const tabID = await getCurrentTabId()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${DEVTOOLSJS}-${tabID}`
    })
    return new DevtoolsMessageSender<T>(toBackGroundPort, tabID!)
  }

  _send<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    this.toBackGroundPort.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    this.onMessage(msg)
  }
}

class PopupMessageSender<T extends Record<keyof T, Imsg<any, any>>> extends MessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(port: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = port
    this.tabID = tabID
    this.type = POPUPJS
    this.toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }

  static async creat<T extends Record<keyof T, Imsg<any, any>>>() {
    const tabID = await getCurrentTabId()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${POPUPJS}-${tabID}`
    })
    return new PopupMessageSender<T>(toBackGroundPort, tabID!)
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    this.toBackGroundPort.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T[K]['req']>) {
    this.onMessage(msg)
  }
}
