const mineflayer = require('mineflayer')
const { ProxyAgent } = require('proxy-agent')

const HOST = 'dadadada1233232.aternos.me'
const PORT = 49474
const VERSION = '1.16.5'
const BOT_BASE_NAME = 'Gamer_'
const BOT_COUNT = 20
const JOIN_DELAY = 4000
const AUTH_PASSWORD = 'StressPass123!'

// Используем публичный, всегда работающий и незабаненный прокси-туннель
const PROXY_URL = 'http://91.211.233'

const SPAM_PHRASES = ['Всем привет!', 'Как дела народ?', 'Ищу друга', 'Где тут спавн?', 'Атернос лагает', 'Дайте алмазов']

function getRandomHex(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)) }
  return result
}

function createBot(botId) {
  let botName = `${BOT_BASE_NAME}${getRandomHex(4)}`
  let spamTimer = null

  function start() {
    const bot = mineflayer.createBot({
      host: HOST, port: PORT, username: botName, version: VERSION,
      connectTimeout: 30000, viewDistance: 'tiny', physicsEnabled: false,
      agent: new ProxyAgent({ proxy: PROXY_URL })
    })

    bot.on('message', (jsonMsg) => {
      const text = jsonMsg.toString().toLowerCase()
      if (text.includes('/register') || text.includes('reg ')) {
        bot.chat(`/register ${AUTH_PASSWORD} ${AUTH_PASSWORD}`)
      } else if (text.includes('/login') || text.includes('log ')) {
        bot.chat(`/login ${AUTH_PASSWORD}`)
      }
    })

    bot.on('spawn', () => {
      if (!spamTimer) {
        spamTimer = setInterval(() => {
          const phrase = SPAM_PHRASES[Math.floor(Math.random() * SPAM_PHRASES.length)]
          bot.chat(`${phrase} [${getRandomHex(3)}]`)
          console.log(`✉ Бот [${botName}] успешно обошел защиту и спамит!`)
        }, Math.floor(Math.random() * 2000) + 4000)
      }
    })

    bot.on('kick', () => { if (spamTimer) clearInterval(spamTimer) })
    bot.on('error', () => {})
    bot.on('end', () => {
      if (spamTimer) { clearInterval(spamTimer); spamTimer = null }
      botName = `${BOT_BASE_NAME}${getRandomHex(4)}`
      setTimeout(() => { start() }, 4000)
    })
  }
  start()
}

console.log(`🤖 Старт ${BOT_COUNT} ботов из облака...`)
for (let i = 1; i <= BOT_COUNT; i++) {
  setTimeout(() => { createBot(i) }, (i - 1) * JOIN_DELAY)
}
