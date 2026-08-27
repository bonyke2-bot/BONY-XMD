const settings = require("../settings");

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

    const menu = `
*╭┈───〔 QUEEN COLAMBIA 〕┈───⊷*
*├▢ 🤖 ᴏᴡɴᴇʀ:* Weed
*├▢ 👤 ᴜsᴇʀ:* ${pushName}
*├▢ 📜 ᴄᴏᴍᴍᴀɴᴅs:* 29
*├▢ ⏱️ ʀᴜɴᴛɪᴍᴇ:* ${uptime}
*├▢ 📦 ᴘʀᴇғɪx:* ${prefix}
*├▢ ⚙️ ᴍᴏᴅᴇ:* public
*├▢ 🏷️ ᴠᴇʀsɪᴏɴ:* 1.0.0
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

> *©️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ WEED TECH*
    `.trim();

    await sock.sendMessage(m.key.remoteJid, {
        image: { url: "https://files.catbox.moe/3dwe96.jpg" },
        caption: menu,
        mentions: [sender],
        contextInfo: {
            externalAdReply: {
                title: "QUEEN COLAMBIA OFFICIAL",
                body: "Join our channel for updates",
                thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
};