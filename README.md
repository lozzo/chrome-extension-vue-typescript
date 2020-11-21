# chrome-extension-vue-typescript
这玩意儿是一个用typescript vue 写chrome插件的一个模版，大家如果有需求可以直接哪去用，里面还有一个我自己封装的消息通信的一个工具，没有经过验证，如果要用，请谨慎使用

-----
This is a template for writing chrome plugins with typescript and vue. If you have any needs, you can use it directly. There is also a tool for message communication that I encapsulated. It has not been verified. If you want to use it, please use it with caution
```typescript
// for devtoolsJs
import { MessageSender, Imsg, getMsgSender } from '@/lib/messages'
interface IExampleMsg {
  getNumber: Imsg<string, number>
}

const msgSender1 = await getMsgSender<IExampleMsg>('devtoolsJs')
msgSender1.on('getNumber', async (data, echo) => {
  console.log(data)
  echo(23333)
})
// for contentJs
import { MessageSender, Imsg, getMsgSender } from '@/lib/messages'
const msgSender2 = await getMsgSender<IExampleMsg>("contentJs")
console.log(await msgSender2.sendMsgToDevtoolJS("getNumber", "get 233333"))
// 23333
```
前端的这些玩意儿可真🤓
