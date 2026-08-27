const settings = require("../settings");
const fs = require("fs");
const path = require("path");

module.exports = async (sock, m) => {
    const sender = m.sender || m.key.participant || m.key.remoteJid || "";
    const pushName = sender.split('@')[0] || "User";

    const prefix = settings.prefix || ".";

    function runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
    }

    const uptime = runtime(process.uptime());

    // Automatically count command files in the commands folder
    let totalCommands = 29; // Fallback value
    try {
        const commandsDir = path.join(__dirname, "../commands"); // Adjust path if needed
        if (fs.existsSync(commandsDir)) {
            const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));
            totalCommands = commandFiles.length;
        }
    } catch (e) {
        console.error("Error counting commands:", e);
    }

    const menu = `
*╭┈───〔 𝐑𝐈𝐅𝐓-𝐌𝐃 〕┈───⊷*
*├▢ 🤖 ᴏᴡɴᴇʀ:* ᴡᴇᴇᴅ ᴛᴇᴄʜ
*├▢ 👤 ᴜsᴇʀ:* ${pushName}
*├▢ 📜 ᴄᴏᴍᴍᴀɴᴅs:* ${totalCommands}
*├▢ ⏱️ ʀᴜɴᴛɪᴍᴇ:* ${uptime}
*├▢ 📦 ᴘʀᴇғɪx:* ${prefix}
*├▢ ⚙️ ᴍᴏᴅᴇ:* public
*├▢ 🏷️ ᴠᴇʀsɪᴏɴ:* 2.0.0
*╰───────────────────⊷*

\`『 ʙᴏᴛ ɪɴғᴏ 』\`
╭───────────────────⊷
*┋ ⬡ ping*
*┋ ⬡ alive*
*┋ ⬡ menu*
*┋ ⬡ owner*
*┋ ⬡ runtime*
*┋ ⬡ status*
*┋ ⬡ system*
╰───────────────────⊷

\`『 ᴛᴏᴏʟs 』\`
╭───────────────────⊷
*┋ ⬡ say*
*┋ ⬡ time*
*┋ ⬡ date*
*┋ ⬡ jid*
*┋ ⬡ restart*
*┋ ⬡ search*
*┋ ⬡ ytmp4*
*┋ ⬡ ytmp3*
*┋ ⬡ igdl*
*┋ ⬡ twitter*
*┋ ⬡ translate*
╰───────────────────⊷

\`『 ɢʀᴏᴜᴘ 』\`
╭───────────────────⊷
*┋ ⬡ kick*
*┋ ⬡ add*
*┋ ⬡ promote*
*┋ ⬡ demote*
*┋ ⬡ delete*
*┋ ⬡ tagall*
*┋ ⬡ open*
*┋ ⬡ close*
*┋ ⬡ link*
*┋ ⬡ hidetag*
╰───────────────────⊷

\`『 sᴇᴛᴛɪɴɢs 』\`
╭───────────────────⊷
*┋ ⬡ setprefix*
*┋ ⬡ setpp*
*┋ ⬡ help*
*┋ ⬡ echo*
*┋ ⬡ welcome*
*┋ ⬡ goodbye*
╰───────────────────⊷

> *©️ 𝓹𝓸𝔀𝓮𝓻𝓮𝓭 𝓫𝔂 𝔀𝓮𝓮𝓭 𝓽𝓮𝓬𝓱*
    `.trim();

    await sock.sendMessage(m.key.remoteJid, {
        image: { url: "https://files.catbox.moe/vv674d.jpg" },
        caption: menu,
        mentions: [sender],
        contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363407561123100@newsletter",
                newsletterName: "RIFT-MD OFFICIAL",
                serverMessageId: 100
            }
        }
    }, { quoted: m });
};
