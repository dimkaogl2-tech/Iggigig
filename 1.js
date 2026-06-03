cat << 'EOF' > 1.js
const util = require('minecraft-server-util');
const readline = require('readline');

// Создаем интерфейс для чтения ввода из консоли
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Функция для задания вопросов в консоли
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.clear();
    console.log(`=========================================`);
    console.log(`    MINECRAFT SERVER CHECKER (TERMUX)    `);
    console.log(`=========================================\n`);

    // Запрашиваем IP сервера
    let host = await askQuestion('🌐 Введите IP сервера: ');
    host = host.trim();

    if (!host) {
        console.log('❌ Ошибка: IP-адрес не может быть пустым!');
        rl.close();
        return;
    }

    // Запрашиваем Порт сервера
    let portInput = await askQuestion('🔌 Введите ПОРТ сервера (нажмите Enter для 25565): ');
    portInput = portInput.trim();
    
    // Если порт не введен, ставим стандартный 25565
    const port = portInput ? parseInt(portInput, 10) : 25565;

    if (isNaN(port) || port < 1 || port > 65535) {
        console.log('❌ Ошибка: Некорректный номер порта!');
        rl.close();
        return;
    }

    console.log(`\n🔍 Проверка сервера ${host}:${port}...\n`);

    try {
        // Запрос статуса
        const result = await util.status(host, port, { timeout: 6000 });

        console.log(`✅ СЕРВЕР ДОСТУПЕН!`);
        console.log(`-------------------------------------`);
        console.log(`🔹 Версия:      ${result.version.name} (Протокол: ${result.version.protocol})`);
        console.log(`🔹 Игроки:     ${result.players.online} / ${result.players.max}`);
        
        // Очистка MOTD от цветовых кодов параграфа (§)
        const cleanMOTD = result.motd.clean.replace(/\n/g, ' ');
        console.log(`🔹 MOTD (Инфо): ${cleanMOTD}`);

        // Логика проверки авторизации
        let authDetected = false;
        let detectionReason = '';

        const motdLower = cleanMOTD.toLowerCase();
        const authKeywords = ['auth', 'login', 'register', 'войти', 'регистрация', 'пароль', 'reg', 'log', 'pass'];
        
        for (const keyword of authKeywords) {
            if (motdLower.includes(keyword)) {
                authDetected = true;
                detectionReason = `найдено ключевое слово "${keyword}" в описании (MOTD)`;
                break;
            }
        }

        if (!authDetected && result.players.sample) {
            const botKeywords = ['authme', 'nlogin', 'login', 'register'];
            for (const player of result.players.sample) {
                const nameLower = player.name.toLowerCase();
                if (botKeywords.some(k => nameLower.includes(k))) {
                    authDetected = true;
                    detectionReason = `в списке игроков обнаружен системный бот (${player.name})`;
                    break;
                }
            }
        }

        console.log(`-------------------------------------`);
        if (authDetected) {
            console.log(`🔐 Авторизация:  ПРИСУТСТВУЕТ (Причина: ${detectionReason})`);
        } else {
            console.log(`❓ Авторизация:  Точно определить не удалось.`);
            console.log(`                 (Явных признаков в MOTD нет, требуется заход)`);
        }
        console.log(`-------------------------------------`);

    } catch (error) {
        console.log(`❌ СЕРВЕР НЕДОСТУПЕН!`);
        console.log(`-------------------------------------`);
        if (error.code === 'ENOTFOUND') {
            console.log(`Ошибка: Неверный IP-адрес или домен (сервер не найден).`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log(`Ошибка: Порт закрыт. Неверный порт или сервер выключен.`);
        } else {
            console.log(`Ошибка соединения: ${error.message}`);
        }
        console.log(`-------------------------------------`);
    }

    rl.close();
}

main();
EOF
