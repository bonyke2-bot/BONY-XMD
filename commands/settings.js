const fs = require("fs");
const path = require("path");

// Path to database.json
const dbPath = path.join(__dirname, "..", "database.json");

function getDatabase() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: {}, antilink: [] }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
        return { users: {}, antilink: [] };
    }
}

function saveDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function isEmoji(text) {
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
    return emojiRegex.test(text);
}

// Main function called by the command loader
module.exports = async function (sock, m, args) {
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    const prefix = require("../settings").prefix || "."; // Get prefix from external settings.js
    
    // Detect command from input text
    const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

    const userId = sock.user.id.split(':')[0];
    const jid = m.key.remoteJid;
    const senderId = m.key.participant ? m.key.participant.split(':')[0] : jid.split(':')[0];
    
    // Check if the sender is the owner from settings
    const settingsFile = require("../settings");
    const isOwner = senderId.includes(settingsFile.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    let db = getDatabase();
    if (!db.users) db.users = {};
    if (!db.users[userId]) db.users[userId] = {};

    switch (command) {
        case 'setprefix': {
            const prefixArg = args[0] || '';
            db.users[userId].prefix = prefixArg;
            saveDatabase(db);
            await sock.sendMessage(jid, { text: `✅ Prefix successfully changed to: "${prefixArg}"` }, { quoted: m });
            break;
        }

        case 'setreaction': {
            const emojiArg = args[0];
            if (emojiArg && isEmoji(emojiArg)) {
                db.users[userId].reaction = emojiArg;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Reaction emoji changed to: ${emojiArg}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Please provide a valid emoji. Example: ${prefix}setreaction ❤️` }, { quoted: m });
            }
            break;
        }

        case 'setwelcome': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].welcome = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Welcome message set to: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Choose an option: ${prefix}setwelcome on or off` }, { quoted: m });
            }
            break;
        }

        case 'setautorecord': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].record = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Autorecord set to: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Choose an option: ${prefix}setautorecord on or off` }, { quoted: m });
            }
            break;
        }

        case 'setautotype': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].type = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Autotype set to: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Choose an option: ${prefix}setautotype on or off` }, { quoted: m });
            }
            break;
        }

        case 'public': {
            if (!isOwner) return await sock.sendMessage(jid, { text: `> *⚠️ Only the bot owner can use this command!*` }, { quoted: m });
            const status = args[0]?.toLowerCase();
            if (status === 'on') {
                db.users[userId].publicMode = true;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: '✅ Public mode enabled' }, { quoted: m });
            } else if (status === 'off') {
                db.users[userId].publicMode = false;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: '🚫 Public mode disabled' }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Usage: ${prefix}public on or off` }, { quoted: m });
            }
            break;
        }
    }
};
