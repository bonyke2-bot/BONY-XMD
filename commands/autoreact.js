const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

const autoreactCommand = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const isOwner = m.key.fromMe || senderIsOwner(m); // Ajiste selon jan w tcheke owner nan rès bot la

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Usage:* `.autoreact on` oswa `.autoreact off`" 
        }, { quoted: m });
    }

    const status = args[0].toLowerCase();
    
    let db = { antilink: [], autoreact: false };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            db = { antilink: [], autoreact: false };
        }
    }

    db.autoreact = (status === 'on');

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await sock.sendMessage(chatId, { 
        text: `🛡️ *Auto-React System:* ${status === 'on' ? 'Activated! ✅' : 'Deactivated! ❌'}` 
    }, { quoted: m });
};

function senderIsOwner(m) {
    // Fonksyon senp pou tcheke si se ou menm ki voye l
    return m.key.fromMe;
}

module.exports = autoreactCommand;