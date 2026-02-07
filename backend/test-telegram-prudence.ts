import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const prudenceId = '8385880441';

if (!token) {
    console.error('No Token found');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

(async () => {
    try {
        const me = await bot.getMe();
        console.log(`Bot Info: @${me.username} (ID: ${me.id})`);

        console.log(`Sending test message to Prudence (ID: ${prudenceId})...`);
        await bot.sendMessage(prudenceId, 'Test message to verify connectivity.');
        console.log('✅ Message sent successfully!');
    } catch (error: any) {
        console.error('❌ Failed to send message:', error.message);

        if (error.message.includes('chat not found')) {
            console.log('\n⚠️ DIAGNOSIS: The user has not started the bot yet or the ID is wrong.');
            try {
                const me = await bot.getMe();
                console.log(`👉 Please ask Prudence to open this link and click START: https://t.me/${me.username}`);
            } catch (e) {
                console.log('Could not retrieve bot info.');
            }
        }
    }
})();
