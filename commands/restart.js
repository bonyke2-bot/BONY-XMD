module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Send the reboot notification first
    await sock.sendMessage(remoteJid, { 
        text: "♻️ *QUEEN COLAMBIA REBOOTING...*\n\nSystem is restarting. Please wait a moment while I refresh my connections. 🚀" 
    }, { quoted: m });

    // 2. Wait 2 seconds (2000ms) to ensure the message is sent before the process kills
    setTimeout(() => {
        console.log("🔄 System reboot initiated by user...");
        process.exit(); 
    }, 2000);
}
