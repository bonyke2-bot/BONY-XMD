// ======================================================
// GOODBYE COMMAND - BONY-XMD
// .goodbye on / .goodbye off
// ======================================================

const fs = require('fs');
const path = require('path');

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
            text: `❌ This command is only for groups!`[span_1](start_span)[span_1](end_span)
        }, { quoted: m });
    }

    const option = args[0]?.toLowerCase();

    if (!option || (option !== 'on' && option !== 'off')) {
        return await sock.sendMessage(chatId, {
            text:
                `❌ *Usage:* \`.goodbye on\` or \`.goodbye off\`\n\n` +[span_2](start_span)[span_2](end_span)
                `💡 *Example:* \`.goodbye on\``[span_3](start_span)[span_3](end_span)
        }, { quoted: m });
    }

    const db = getDb();
    if (!db.groups) db.groups = {};
    if (!db.groups[chatId]) db.groups[chatId] = {};

    db.groups[chatId].goodbye = (option === 'on');
    saveDb(db);

    await sock.sendMessage(chatId, {
        text: option === 'on'
            ? `✅ *Goodbye enabled!* Members leaving the group will receive a goodbye message.`[span_4](start_span)[span_4](end_span)
            : `❌ *Goodbye disabled!* No more goodbye messages.`[span_5](start_span)[span_5](end_span)
    }, { quoted: m });
};
