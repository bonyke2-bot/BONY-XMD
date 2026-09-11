// ======================================================
// GOODBYE COMMAND - BONY-XMD
// .goodbye on / .goodbye off
// ======================================================

const fs = require('fs');
const path = require('path');
const { getSetting } = require('../lib/settings.cjs');

const dbPath = path.join(__dirname, '..', 'database.json');

function getDb() {
    try {
        if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch {}
    return {};
}

function saveDb(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    if (!isGroup) {
        return await sock.sendMessage(chatId, {
            text: `❌ This command is only for groups!`
        }, { quoted: m });
    }

    const option = args[0]?.toLowerCase();
    const prefix = getSetting('prefix') || '.';

    if (!option || (option !== 'on' && option !== 'off')) {
        return await sock.sendMessage(chatId, {
      text:
        `❌ *Usage:* \`${prefix}goodbye on\` or \`${prefix}goodbye off\`\n\n` +
        `💡 *Example:* \`${prefix}goodbye on\``
    }, { quoted: m });
    }

    const db = getDb();
    if (!db.groups) db.groups = {};
    if (!db.groups[chatId]) db.groups[chatId] = {};

    db.groups[chatId].goodbye = (option === 'on');
    saveDb(db);

    await sock.sendMessage(chatId, {
        text: option === 'on'
            ? `✅ *Goodbye enabled!* Members leaving the group will receive a goodbye message.`
            : `❌ *Goodbye disabled!* No more goodbye messages.`
    }, { quoted: m });
};
