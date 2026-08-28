const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

const autotypingCommand = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Usage:* `.autotyping on` oswa `.autotyping off`" 
        }, { quoted: m });
    }

    const status = args[0].toLowerCase();
    
    let db = { antilink: [], autoreact: false, autoread: false, autotyping: false };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            db = { antilink: [], autoreact: false, autoread: false, autotyping: false };
        }
    }

    db.autotyping = (status === 'on');

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await sock.sendMessage(chatId, { 
        text: `⌨️ *Auto-Typing System:* ${status === 'on' ? 'Activated! ✅' : 'Deactivated! ❌'}` 
    }, { quoted: m });
};

module.exports = autotypingCommand;