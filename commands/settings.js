const fs = require("fs");
const path = require("path");

// Chemen pou database.json la (menm jan ak nan main.js)
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

// Sa a se fonksyon prensipal kòmand loader a ap rele
module.exports = async function (sock, m, args) {
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    const prefix = require("../settings").prefix || "."; // Li prefix la nan settings.js deyò a
    
    // Detekte kòmand lan nan kòd la
    const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

    const userId = sock.user.id.split(':')[0];
    const jid = m.key.remoteJid;
    const senderId = m.key.participant ? m.key.participant.split(':')[0] : jid.split(':')[0];
    
    // Tcheke si se Owner la nan settings yo
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
            await sock.sendMessage(jid, { text: `✅ Prefix chanje avèk siksè: "${prefixArg}"` }, { quoted: m });
            break;
        }

        case 'setreaction': {
            const emojiArg = args[0];
            if (emojiArg && isEmoji(emojiArg)) {
                db.users[userId].reaction = emojiArg;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Emoji reaksyon chanje: ${emojiArg}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Tanpri mete yon emoji valab. Egzanp: ${prefix}setreaction ❤️` }, { quoted: m });
            }
            break;
        }

        case 'setwelcome': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].welcome = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Mesaj Byenveni (Welcome) mete sou: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Chwazi yon opsyon: ${prefix}setwelcome on oswa off` }, { quoted: m });
            }
            break;
        }

        case 'setautorecord': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].record = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Autorecord mete sou: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Chwazi yon opsyon: ${prefix}setautorecord on oswa off` }, { quoted: m });
            }
            break;
        }

        case 'setautotype': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].type = (status === 'on');
                saveDatabase(db);
                await sock.sendMessage(jid, { text: `✅ Autotype mete sou: ${status.toUpperCase()}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Chwazi yon opsyon: ${prefix}setautotype on oswa off` }, { quoted: m });
            }
            break;
        }

        case 'public': {
            if (!isOwner) return await sock.sendMessage(jid, { text: `> *⚠️ Sèlman mèt bot la ki ka itilize kòmand sa a!*` }, { quoted: m });
            const status = args[0]?.toLowerCase();
            if (status === 'on') {
                db.users[userId].publicMode = true;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: '✅ Mode public activé' }, { quoted: m });
            } else if (status === 'off') {
                db.users[userId].publicMode = false;
                saveDatabase(db);
                await sock.sendMessage(jid, { text: '🚫 Mode public désactivé' }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `❌ Itilize: ${prefix}public on oswa off` }, { quoted: m });
            }
            break;
        }
    }
};
