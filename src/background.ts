import { colorInfoLog } from './common/utils'
import { getMsgSender } from './common/messages'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender('backgroundJs')
  sender.on('xx', (x: any) => {
    colorInfoLog('background', 'msg', x)
  })
})()
