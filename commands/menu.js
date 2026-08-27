const settings = require("../settings");
const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    const sender = m.sender || m.key.participant || m.key.remoteJid || "";
    const pushName = sender.split('@')[0] || "User";
    const chatId = m.key.remoteJid;
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

    // Li tout dosye ki nan katab commands yo otomatikman
    let commandList = [];
    try {
        const commandsDir = path.join(__dirname, "../commands");
        if (fs.existsSync(commandsDir)) {
            commandList = fs.readdirSync(commandsDir)
                .filter(file => file.endsWith(".js"))
                .map(file => file.replace(".js", ""));
        }
    } catch (e) {
        console.error("Error reading commands folder:", e);
    }

    const totalCommands = commandList.length;

    // Kategori predefined pou kòmand ou yo
    const categories = {
        "BOT INFO": ["alive", "ping", "menu", "owner", "runtime", "info", "jid", "gstatut", "jidnewsletter", "fb"],
        "TOOLS": ["play", "search", "ytmp3", "igdl", "twitter", "translate", "clear", "date"],
        "GROUP": ["kick", "kickall", "add", "promote", "demote", "delete", "tagall", "open", "close", "link", "hidetag"],
        "SETTINGS": ["antilink", "setprefix", "setpp", "help", "welcome", "goodbye"]
    };

    // Verifye si gen lòt kòmand ki pa nan lis kategori yo pou n mete yo nan "OTHER"
    const categorizedCommands = new Set(Object.values(categories).flat());
    const otherCommands = commandList.filter(cmd => !categorizedCommands.has(cmd));
    if (otherCommands.length > 0) {
        categories["OTHER"] = otherCommands;
    }

    // Jenere tèks bwat pou chak kategori
    let menuCategoriesText = "";
    for (const [catName, cmds] of Object.entries(categories)) {
        if (cmds.length === 0) continue;
        
        const formattedCmds = cmds.map(cmd => `*┋ ⬡ ${cmd}*`).join("\n");
        menuCategoriesText += `\n\`『 ${catName} 』\`\n╭───────────────────⊷\n${formattedCmds}\n╰───────────────────⊷\n`;
    }

    try {
        // Voye mesaj "Loading..." an premye
        await sock.sendMessage(chatId, { text: "⚡ Loading menu..." }, { quoted: m });

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
${menuCategoriesText}
> *©️ 𝓹𝓸𝔀𝓮𝓻𝓮𝓭 𝓫𝔂 𝔀𝓮𝓮𝓭 𝓽𝓮ᑦ𝒽*
    `.trim();

        const channelInfo = {
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363407561123100@newsletter",
                    newsletterName: "RIFT-MD OFFICIAL",
                    serverMessageId: -1
                }
            }
        };

        // Voye imaj orijinal la ak tout kategori yo separe net
        await sock.sendMessage(chatId, {
            image: { url: "https://files.catbox.moe/vv674d.jpg" },
            caption: menu,
            ...channelInfo
        }, { quoted: m });

    } catch (e) {
        console.error("Menu Error:", e);
    }
};
