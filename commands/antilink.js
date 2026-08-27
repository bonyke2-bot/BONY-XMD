const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    
    // Sekirite: Tcheke si se Owner la
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    if (!isGroup) return sock.sendMessage(from, { text: "❌ This command can only be used in groups." });
    if (!isOwner) return sock.sendMessage(from, { text: "❌ Access Denied: Only the Bot Owner can configure AntiLink." });

    if (!args[0]) return sock.sendMessage(from, { text: "Usage: .antilink on/off" });

    const dbPath = path.join(__dirname, "../database.json");
    
    // Li database la
    let db = { antilink: [] };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        } catch (e) {
            db = { antilink: [] };
        }
    }

    if (args[0] === "on") {
        if (!db.antilink.includes(from)) {
            db.antilink.push(from);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
        await sock.sendMessage(from, { text: "🛡️ *AntiLink Activated:* I will now monitor and delete links in this group." });
    } 
    else if (args[0] === "off") {
        if (db.antilink.includes(from)) {
            db.antilink = db.antilink.filter(id => id !== from);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
        await sock.sendMessage(from, { text: "🛡️ *AntiLink Deactivated:* Links are now allowed." });
    } 
    else {
        await sock.sendMessage(from, { text: "❓ Invalid option. Use: *.antilink on* or *.antilink off*" });
    }
};
