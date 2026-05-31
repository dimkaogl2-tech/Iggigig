const mineflayer = require('mineflayer')
const { ProxyAgent } = require('proxy-agent')
const axios = require('axios')
const net = require('net')

const HOST = 'dadadada1233232.aternos.me' 
const PORT = 49474                        
const VERSION = '1.16.5'
const BOT_BASE_NAME = 'Gamer_' 
const BOT_COUNT = 20               
const JOIN_DELAY = 3000 

const AUTH_PASSWORD = 'StressPass123!' 

const PROXY_SOURCES = [
  'https://proxyspace.pro',
  'https://githubusercontent.com',
  'https://proxyscrape.com'
]

let RAW_PROXIES = []
let VALID_PROXIES = [] 

async function loadProxies() {
  console.log('⏳ Выкачивание свежих SOCKS5 прокси из баз данных...')
  let combinedProxies = []

  for (const url of PROXY_SOURCES) {
    try {
      const response = await axios.get(url, { timeout: 6000 })
      if (response.data && typeof response.data === 'string') {
        const lines = response.data.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0 && line.includes(':'))
        combinedProxies = combinedProxies.concat(lines)
      }
    } catch (err) {}
  }

  const uniqueProxies = [...new Set(combinedProxies)]
  RAW_PROXIES = uniqueProxies.map(p => p.replace('socks5://', ''))
  console.log(`📡 Собрано ${RAW_PROXIES.length} потенциальных прокси.`)
}

function checkProxy(proxyStr) {
  return new Promise((resolve) => {
    const parts = proxyStr.split(':')
    if (parts.length < 2) return resolve(false)
    const socket = new net.Socket()
    socket.setTimeout(3000) 
    socket.on('connect', () => { socket.destroy(); resolve(true) })
    const onError = () => { socket.destroy(); resolve(false) }
    socket.on('timeout', onError)
    socket.on('error', onError)
    socket.connect(parseInt(parts[1]), parts[0])
  })
}

async function filterProxies() {
  console.log('⚡ Быстрая проверка прокси-базы облаком...');
  const BATCH_SIZE = 50 
  for (let i = 0; i < RAW_PROXIES.length; i += BATCH_SIZE) {
    const batch = RAW_PROXIES.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (proxy) => {
      if (await checkProxy(proxy)) VALID_PROXIES.push(`socks5://${proxy}`)
    }))
    if (VALID_PROXIES.length >= 40) break
  }
  console.log(`🔥 Найдено гарантированно ЖИВЫХ прокси: ${VALID_PROXIES.length}`)
}

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
    if (VALID_PROXIES.length === 0) return
    const proxyUrl = VALID_PROXIES[Math.floor(Math.random() * VALID_PROXIES.length)]

    const bot = mineflayer.createBot({
      host: HOST, port: PORT, username: botName, version: VERSION,
      connectTimeout: 25000, viewDistance: 'tiny', physicsEnabled: false,
      agent: new ProxyAgent({ proxy: proxyUrl })
    })

    bot.on('spawn', () => {
      if (!spamTimer) {
        spamTimer = setInterval(() => {
          bot.chat(`Всем привет! [${getRandomHex(3)}]`)
          console.log(`✉ Бот [${botName}] зашел через рабочий прокси и спамит!`)
        }, 5000)
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

async function main() {
  await loadProxies()
  await filterProxies()
  console.log(`🤖 Пул собран. Запуск ${BOT_COUNT} ботов из облака...`)
  for (let i = 1; i <= BOT_COUNT; i++) {
    setTimeout(() => { createBot(i) }, (i - 1) * JOIN_DELAY)
  }
}
main()
