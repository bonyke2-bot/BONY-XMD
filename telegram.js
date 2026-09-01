const { Telegraf } = require('telegraf');

function startTelegramBot() {
    // Insert your token here
    const bot = new Telegraf('8852120730:AAFPDMVFn-8sKjUkCVjjNycwLKLVUFGrryc');

    bot.start((ctx) => {
        ctx.reply('Welcome! RIFT-MD Telegram Bot is running alongside WhatsApp.');
    });

    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            await ctx.reply('Analyzing the link on Telegram... Please wait.');
        } else {
            ctx.reply('Please send a valid link starting with http:// or https://');
        }
    });

    bot.launch();
    console.log('🤖 Telegram Bot launched successfully!');

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = startTelegramBot;
