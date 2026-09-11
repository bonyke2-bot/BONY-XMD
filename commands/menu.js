const { getSetting } = require("../lib/settings.cjs");
const fs = require("fs");
const path = require("path");

module.exports = async (sock, m, args) => {
    try {
        const pushName =
            m.pushName ||
            m.senderPn ||
            (m.sender ? m.sender.split("@")[0] : "User");

        const chatId = m.key.remoteJid;
        const prefix = getSetting("prefix") || ".";

        function runtime(seconds) {
            seconds = Number(seconds);
            const d = Math.floor(seconds / (3600 * 24));
            const h = Math.floor((seconds % (3600 * 24)) / 3600);
            const min = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);

            return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${min > 0 ? min + "m " : ""}${s}s`;
        }

        const uptime = runtime(process.uptime());

        let commandList = [];

        try {
            const commandsDir = path.join(__dirname, "../commands");

            if (fs.existsSync(commandsDir)) {
                commandList = fs.readdirSync(commandsDir)
                    .filter(file => file.endsWith(".js"))
                    .map(file => file.replace(".js", "").toLowerCase());
            }
        } catch (error) {
            console.error("Error reading commands folder:", error);
        }

        const totalCommands = commandList.length;

        const categories = {
            "BOT INFO": [
                "alive",
                "ping",
                "menu",
                "owner",
                "runtime",
                "gstatut",
                "jidnewsletter",
                "fb",
                "repo"
            ],

            "TOOLS": [
                "play",
                "igdl",
                "twitter",
                "clear",
                "tourl",
                "video",
                "vv",
                "image"
            ],

            "GROUP": [
                "kick",
                "kickall",
                "add",
                "promote",
                "demote",
                "delete",
                "tagall",
                "open",
                "close",
                "link",
                "hidetag"
            ],

            "SETTINGS": [
                "antilink",
                "setprefix",
                "help",
                "mode",
                "autoreact",
                "autoread",
                "autotyping"
            ]
        };

        const categorizedCommands = new Set(
            Object.values(categories).flat()
        );

        const otherCommands = commandList.filter(
            cmd => !categorizedCommands.has(cmd)
        );

        if (otherCommands.length > 0) {
            categories["OTHER"] = otherCommands;
        }

        let menuCategoriesText = "";

        for (const [categoryName, commands] of Object.entries(categories)) {
            const activeCommands = commands.filter(
                cmd => commandList.includes(cmd)
            );

            if (activeCommands.length === 0) continue;

            const formattedCommands = activeCommands
                .map(cmd => `*┋ ⬡ ${prefix}${cmd}*`)
                .join("\n");

            menuCategoriesText +=
                `\n\`『 ${categoryName} 』\`\n` +
                `╭───────────────────⊷\n` +
                `${formattedCommands}\n` +
                `╰───────────────────⊷\n`;
        }

        const menu =
`*╭┈───〔 𝐁𝐎𝐍𝐘-𝐗𝐌𝐃 〕┈───⊷*
*├▢ 🤖 ᴏᴡɴᴇʀ:* ${getSetting("ownerName") || "BONY KE"}
*├▢ 👤 ᴜsᴇʀ:* ${pushName}
*├▢ 📜 ᴄᴏᴍᴍᴀɴᴅs:* ${totalCommands}
*├▢ ⏱️ ʀᴜɴᴛɪᴍᴇ:* ${uptime}
*├▢ 📦 ᴘʀᴇғɪx:* ${prefix}
*├▢ ⚙️ ᴍᴏᴅᴇ:* ${getSetting("mode") || "public"}
*├▢ 🏷️ ᴠᴇʀsɪᴏɴ:* ${getSetting("version") || "2.0.0"}
*╰───────────────────⊷*
${menuCategoriesText}
> *©️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁𝐎𝐍𝐘-𝐗𝐌𝐃*`;

        await sock.sendMessage(
            chatId,
            {
                image: {
                    url: "https://files.catbox.moe/8rcgs3.jpg"
                },
                caption: menu
            },
            {
                quoted: m
            }
        );

    } catch (error) {
        console.error("Menu Error:", error);

        await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "❌ Menu failed to load. Check the Termux error."
            },
            {
                quoted: m
            }
        );
    }
};
