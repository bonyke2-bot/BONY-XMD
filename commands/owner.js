const settings = require('../settings');

const { createFakeContact } = require('../lib/fakeContact');
/**
 * Sends the owner's contact card to a given chat.
 * @param {object} sock - The WhatsApp socket instance.
 * @param {string} chatId - The ID of the chat to send the vCard to.
 */
async function ownerCommand(sock, chatId) {
    try {
        if (!settings.botOwner || !settings.ownerNumber) {
            console.error('\x1b[35m[OWNER COMMAND]\x1b[0m Missing botOwner or ownerNumber in settings.');
            return;
        }

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${settings.botOwner}`,
            `TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}`,
            'END:VCARD',
        ].join('\n');

        const ownerText = `╭━━━〔 👑 BONY-XMD OWNER 〕━━━╮
┃
┃ 👤 Name: ${settings.botOwner}
┃ 📱 Contact: +${settings.ownerNumber}
┃
┃ 🤖 Bot: BONY-XMD 👑
┃ ⚡ Status: Available
┃ 💬 Feel free to contact owner 🔥
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

📇 Owner's contact card is attached below.`;

        await sock.sendMessage(chatId, { text: ownerText });

        await sock.sendMessage(chatId, {
            contacts: {
                displayName: settings.botOwner,
                contacts: [{ vcard }],
            },
        });

        console.log(`\x1b[35m[OWNER COMMAND]\x1b[0m Sent owner contact card to chat: ${chatId}`);
    } catch (error) {
        console.error('\x1b[35m[OWNER COMMAND ERROR]\x1b[0m', error);
    }
}

module.exports = ownerCommand;
