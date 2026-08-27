const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    if (!isOwner) {
        return await sock.sendMessage(from, { text: "❌ *Access Denied:* Only the Bot Owner can use this command." });
    }

    if (!args[0]) {
        return await sock.sendMessage(from, { text: `❌ *Usage:* ${settings.prefix}setprefix [nouvo prefix]\n*Egzanp:* ${settings.prefix}setprefix !` });
    }

    const newPrefix = args[0];

    try {
        const settingsPath = path.join(__dirname, "../settings.js");
        let settingsContent = fs.readFileSync(settingsPath, "utf-8");
        
        settingsContent = settingsContent.replace(/prefix:\s*["'`].*?["'`]/, `prefix: "${newPrefix}"`);
        fs.writeFileSync(settingsPath, settingsContent, "utf-8");

        await sock.sendMessage(from, { text: `✅ *Prefix successfully changed to:* \`${newPrefix}\`\n🔄 *Bot la ap fè yon oto-restart touswit...*` });

        // Fòse bot la fè restart otomatikman sou panèl la
        setTimeout(() => {
            process.exit(0);
        }, 1500);

    } catch (e) {
        console.error("SetPrefix Error:", e);
        await sock.sendMessage(from, { text: "❌ *Error:* Failed to update prefix." });
    }
};