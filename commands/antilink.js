const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    
    // Security check: Verify if the sender is the Bot Owner or the Bot itself
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    if (!isGroup) {
        return await sock.sendMessage(from, { text: "❌ *Access Denied:* This command can only be executed inside groups." }, { quoted: m });
    }
    
    if (!isOwner) {
        return await sock.sendMessage(from, { text: "❌ *Access Denied:* Restricted command for Bot Owner only." }, { quoted: m });
    }

    if (!args[0]) {
        return await sock.sendMessage(from, { 
            text: "👑 *RIFT-MD - ANTILINK*\n\n📌 *Usage:* `.antilink on` or `.antilink off`" 
        }, { quoted: m });
    }

    const dbPath = path.join(__dirname, "../database.json");
    
    // Load database safely
    let db = { antilink: [] };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
            if (!Array.isArray(db.antilink)) db.antilink = [];
        } catch (e) {
            db = { antilink: [] };
        }
    }

    const action = args[0].toLowerCase();

    if (action === "on") {
        if (!db.antilink.includes(from)) {
            db.antilink.push(from);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
        await sock.sendMessage(from, { 
            text: "╭━━━〔 *ANTILINK SYSTEM* 〕━━━⡱\n┃ 🛡️ *Status:* Activated ✅\n┃ 🤖 *Bot:* RIFT-MD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });
    } 
    else if (action === "off") {
        if (db.antilink.includes(from)) {
            db.antilink = db.antilink.filter(id => id !== from);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
        await sock.sendMessage(from, { 
            text: "╭━━━〔 *ANTILINK SYSTEM* 〕━━━⡱\n┃ 🛡️ *Status:* Deactivated ❌\n┃ 🤖 *Bot:* RIFT-MD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });
    } 
    else {
        await sock.sendMessage(from, { 
            text: "❌ *Invalid Option!*\n💡 *Please use:* `.antilink on` or `.antilink off`" 
        }, { quoted: m });
    }
};
