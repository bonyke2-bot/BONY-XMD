module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;

    // 1. Send the reboot notification first
    await sock.sendMessage(chatId, { 
        text: "╭━━━〔 *SYSTEM REBOOT* 〕━━━⡱\n┃ ♻️ *Status:* Restarting...\n┃ 🤖 *Bot:* RIFT-MD\n╰━━━━━━━━━━━━━━━━━━━━⬣\n\n_Please wait a moment while I refresh my connections..._" 
    }, { quoted: m });

    // 2. Wait 2 seconds (2000ms) to ensure the message is sent before the process exits
    setTimeout(() => {
        console.log("🔄 System reboot initiated by user...");
        process.exit(0); 
    }, 2000);
};
