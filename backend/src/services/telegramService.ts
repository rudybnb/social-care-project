// Telegram Bot Service for Clock-in Reminders
// Uses the Telegram Bot API to send reminders to staff

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../index.js';
import { staff } from '../schema.js';
import { eq } from 'drizzle-orm';

// Telegram Bot Token - set this in environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID || '';

// Initialize bot (polling mode for receiving messages, webhook mode for production)
let bot: TelegramBot | null = null;

export function initTelegramBot() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram reminders disabled');
        return null;
    }

    try {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

        // Handle /start command - this is how staff link their account
        bot.onText(/\/start (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const staffId = match ? match[1] : null;

            if (!staffId) {
                bot?.sendMessage(chatId, '❌ Invalid link. Please use the link from your staff app.');
                return;
            }

            try {
                // Update staff record with their Telegram chat ID
                if (db) {
                    await db.update(staff)
                        .set({ telegramChatId: chatId.toString() })
                        .where(eq(staff.id, staffId));

                    const staffMember = await db.select().from(staff).where(eq(staff.id, staffId));
                    const name = staffMember[0]?.name || 'Staff Member';

                    bot?.sendMessage(chatId,
                        `✅ Connected successfully!\n\nHello ${name}! You will now receive:\n` +
                        `📍 Clock-in reminders before your shift\n` +
                        `⏰ Alerts if you forget to clock in/out\n\n` +
                        `Make sure to keep Telegram notifications enabled!`
                    );

                    console.log(`✅ Telegram linked for staff ${staffId} -> chat ${chatId}`);
                }
            } catch (error) {
                console.error('Error linking Telegram account:', error);
                bot?.sendMessage(chatId, '❌ Error linking your account. Please try again or contact admin.');
            }
        });



        // Handle /start command without parameters
        bot.onText(/^\/start$/, async (msg) => {
            const chatId = msg.chat.id;
            bot?.sendMessage(chatId,
                '👋 Welcome to the Social Care Clock-in Bot!\n\n' +
                'To link your account:\n' +
                '1. Open the Staff App\n' +
                '2. Go to Settings\n' +
                '3. Tap "Link Telegram"\n' +
                '4. Click the link provided\n\n' +
                'If you\'re an admin, your chat ID is: ' + chatId
            );
        });

        console.log('✅ Telegram bot initialized successfully');
        return bot;
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error);
        return null;
    }
}

// Send a message to a specific staff member
export async function sendTelegramMessage(staffId: string, message: string): Promise<boolean> {
    if (!bot || !db) return false;

    try {
        const staffMember = await db.select().from(staff).where(eq(staff.id, staffId));
        const chatId = staffMember[0]?.telegramChatId;

        if (!chatId) {
            console.log(`⚠️  Staff ${staffId} has no Telegram linked`);
            return false;
        }

        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`📱 Telegram sent to ${staffId}: ${message.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send Telegram to ${staffId}:`, error);
        return false;
    }
}

// Send a message to admin
export async function sendAdminTelegram(message: string): Promise<boolean> {
    if (!bot || !ADMIN_CHAT_ID) {
        console.warn('⚠️  Cannot send admin Telegram - bot or ADMIN_CHAT_ID not configured');
        return false;
    }

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        console.log(`📱 Admin Telegram sent: ${message.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send admin Telegram:', error);
        return false;
    }
}

// Send clock-in reminder to staff
export async function sendClockInReminder(staffId: string, siteName: string, startTime: string): Promise<boolean> {
    const message =
        `⏰ <b>Shift Reminder</b>\n\n` +
        `Your shift at <b>${siteName}</b> starts at <b>${startTime}</b>.\n\n` +
        `📍 Don't forget to clock in when you arrive!`;

    return sendTelegramMessage(staffId, message);
}

// Send late clock-in alert to staff
export async function sendLateClockInAlert(staffId: string, siteName: string, startTime: string, minutesLate: number): Promise<boolean> {
    const message =
        `⚠️ <b>Clock-In Alert</b>\n\n` +
        `You haven't clocked in for your shift at <b>${siteName}</b>.\n` +
        `Shift started: ${startTime} (${minutesLate} minutes ago)\n\n` +
        `🔔 Please clock in now!`;

    return sendTelegramMessage(staffId, message);
}

// Send clock-out reminder to staff
export async function sendClockOutReminder(staffId: string, siteName: string, endTime: string): Promise<boolean> {
    const message =
        `🏁 <b>Shift Ending</b>\n\n` +
        `Your shift at <b>${siteName}</b> ends at <b>${endTime}</b>.\n\n` +
        `📍 Don't forget to clock out before you leave!`;

    return sendTelegramMessage(staffId, message);
}

// Send forgot clock-out alert to staff
export async function sendForgotClockOutAlert(staffId: string, siteName: string, endTime: string): Promise<boolean> {
    const message =
        `🔴 <b>Clock-Out Alert</b>\n\n` +
        `You haven't clocked out from <b>${siteName}</b>.\n` +
        `Shift ended: ${endTime}\n\n` +
        `⚠️ Please clock out now, or your shift may be auto-clocked out!`;

    return sendTelegramMessage(staffId, message);
}

// Send shift summary to admin
export async function sendShiftSummary(
    shiftType: 'Day' | 'Night',
    totalShifts: number,
    clockedIn: number,
    notClockedIn: number,
    clockedOut: number,
    notClockedOut: number
): Promise<boolean> {
    const message =
        `📊 <b>${shiftType} Shift Summary</b>\n\n` +
        `Total Shifts: ${totalShifts}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `✅ Clocked In: ${clockedIn}\n` +
        `❌ Not Clocked In: ${notClockedIn}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `✅ Clocked Out: ${clockedOut}\n` +
        `❌ Not Clocked Out: ${notClockedOut}`;

    return sendAdminTelegram(message);
}

// Generate Telegram link for a staff member
export function generateTelegramLink(staffId: string): string {
    if (!TELEGRAM_BOT_TOKEN) return '';

    // Extract bot username from token (first part before colon)
    // For now, return a placeholder - the actual username needs to be configured
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername';
    return `https://t.me/${botUsername}?start=${staffId}`;
}

export { bot };
