const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

const modeCommand = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    if (!args[0] || !['public', 'private'].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Usage:* `.mode public` or `.mode private`" 
        }, { quoted: m });
    }

    const newMode = args[0].toLowerCase();
    
    let db = { antilink: [], autoreact: false, autoread: false, autotyping: false, mode: "public" };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            // Fallback to default values if error occurs
        }
    }

    db.mode = newMode;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await sock.sendMessage(chatId, { 
        text: `⚙️ *Mode System:* The bot is now in **${newMode}** mode! ✅` 
    }, { quoted: m });
};

module.exports = modeCommand;
