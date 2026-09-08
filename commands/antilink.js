const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    if (!isGroup) {
        return await sock.sendMessage(from, { text: "❌ *Access Denied:* This command can only be executed inside groups." }, { quoted: m });
    }
    
    if (!isOwner) {
        return await sock.sendMessage(from, { text: "❌ *Access Denied:* Restricted command for Bot Owner only." }, { quoted: m });
    }

    if (!args[0]) {
        return await sock.sendMessage(from, { 
            text: "👑 *BONY-XMD - ANTILINK SETUP*\n\n📌 *Usage:*\n• `.antilink on` (Default Warn 3x)\n• `.antilink kick` (Instant Kick)\n• `.antilink off` (Deactivate)" 
        }, { quoted: m });
    }

    const dbPath = path.join(__dirname, "../database.json");
    let db = { antilink: [], antilinkMode: {} };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
            if (!Array.isArray(db.antilink)) db.antilink = [];
            if (!db.antilinkMode) db.antilinkMode = {};
        } catch (e) {
            db = { antilink: [], antilinkMode: {} };
        }
    }

    const action = args[0].toLowerCase();

    if (action === "on" || action === "warn") {
        if (!db.antilink.includes(from)) db.antilink.push(from);
        db.antilinkMode[from] = "warn"; // 3 warns then kick
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await sock.sendMessage(from, { 
            text: "╭━━━〔 *ANTILINK SYSTEM* 〕━━━⡱\n┃ 🛡️ *Status:* Activated ✅\n┃ ⚡ *Mode:* Warn (3 Warnings = Kick)\n┃ 🤖 *Bot:* BONY-XMD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });
    } 
    else if (action === "kick") {
        if (!db.antilink.includes(from)) db.antilink.push(from);
        db.antilinkMode[from] = "kick"; // Instant kick
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await sock.sendMessage(from, { 
            text: "╭━━━〔 *ANTILINK SYSTEM* 〕━━━⡱\n┃ 🛡️ *Status:* Activated ✅\n┃ ⚡ *Mode:* Instant Kick ❌\n┃ 🤖 *Bot:* BONY-XMD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });
    }
    else if (action === "off") {
        db.antilink = db.antilink.filter(id => id !== from);
        delete db.antilinkMode[from];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await sock.sendMessage(from, { 
            text: "╭━━━〔 *ANTILINK SYSTEM* 〕━━━⡱\n┃ 🛡️ *Status:* Deactivated ❌\n┃ 🤖 *Bot:* BONY-XMD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });
    } 
    else {
        await sock.sendMessage(from, { 
            text: "❌ *Invalid Option!*\n💡 *Please use:* `.antilink on`, `.antilink kick`, or `.antilink off`" 
        }, { quoted: m });
    }
};
