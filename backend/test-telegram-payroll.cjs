require('dotenv').config();
// Mocking the Telegram Bot just to test the send function logic? 
// Actually, we want to test the REAL Telegram send.
// But we can't import the TS files directly in CJS easily without build.
// So we will use a simplified script that replicates the logic of sendTelegramMessage using the raw 'node-telegram-bot-api' to verify credentials and chat ID first.

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

async function testTelegram() {
    console.log('📱 Testing Telegram Notification...');
    console.log(`Token: ${token ? 'Set' : 'Missing'}`);
    console.log(`Chat ID: ${chatId}`);

    if (!token || !chatId) {
        console.error('❌ Missing credentials via .env');
        return;
    }

    const bot = new TelegramBot(token, { polling: false });

    // Mock Payroll Data
    const reportData = {
        date: '2025-01-14',
        staffCount: 5,
        totalHours: 42.5,
        totalCost: 560.25,
        breakdownText:
            "Lauren Alecia        |  12.0h | £150.00\n" +
            "Melissa Blake        |   8.0h | £100.00\n" +
            "Irina Mitrovici      |  10.5h | £135.25\n" +
            "Evander Fisher       |  12.0h | £175.00"
    };

    const breakdown = reportData.breakdownText;

    // Exact message format from telegramService.ts
    const message =
        `📅 <b>Daily Payroll Report</b>\n` +
        `Date: ${reportData.date}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👥 Staff Worked: ${reportData.staffCount}\n` +
        `⏱ Total Hours: ${reportData.totalHours} hrs\n` +
        `💷 <b>Total Cost: £${reportData.totalCost}</b>\n\n` +
        `<b>Breakdown:</b>\n` +
        `<pre>${breakdown}</pre>\n` +
        `(End of Report)\n\n[Test sent from debugger]`;

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log('✅ Telegram message sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send Telegram:', error.message);
        if (error.response) {
            console.error('Response:', error.response.body);
        }
    }
}

testTelegram();
