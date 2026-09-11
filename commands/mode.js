const {
    getSetting,
    saveSettings
} = require("../lib/settings.cjs");

const modeCommand = async (sock, m, args) => {
    const chatId = m.key.remoteJid;


    const senderId = m.key.participant
        ? m.key.participant.split(":")[0]
        : chatId.split(":")[0];

    const ownerNumber = String(getSetting("ownerNumber") || "").replace(/[^0-9]/g, "");

    const isOwner =
        m.key.fromMe ||
        senderId.replace(/[^0-9]/g, "") === ownerNumber;

    if (!isOwner) {
        return await sock.sendMessage(
            chatId,
            {
                text: "❌ Only the bot owner can change the bot mode."
            },
            { quoted: m }
        );
    }

    const mode = args[0]?.toLowerCase();

    if (!["public", "private"].includes(mode)) {
        const currentMode = getSetting("mode");

        return await sock.sendMessage(
            chatId,
            {
                text:
                    `⚙️ *Current Mode:* ${currentMode}\n\n` +
                    `Usage:\n` +
                    `!mode public\n` +
                    `!mode private`
            },
            { quoted: m }
        );
    }

    saveSettings({
        mode
    });

    await sock.sendMessage(
        chatId,
        {
            text: `✅ *BONY-XMD Mode*\n\nBot mode changed to: *${mode.toUpperCase()}*`
        },
        { quoted: m }
    );
};

module.exports = modeCommand;
