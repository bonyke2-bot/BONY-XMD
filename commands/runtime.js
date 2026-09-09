module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // Function to convert seconds into a readable format
    function runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        
        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        
        // If everything is zero, show at least 0 seconds
        if (!dDisplay && !hDisplay && !mDisplay && !sDisplay) return "0 seconds";
        
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    const uptime = runtime(process.uptime());

    // 1. Modern Cyberpunk / Tech Design Template
    const runtimeMessage = `╭━━━〔 *SYSTEM UPTIME* 〕━━━⬣
┃ 🚀 *Status:* \`Active & Online\`
┃ ⏱️ *Runtime:* \`${uptime}\`
┃ ⚙️ *System:* \`Stable\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> *BONY-XMD is running smoothly.* 💜`.trim();

    // 2. Send message with rich card preview (AdReply enabled for a modern look)
    await sock.sendMessage(remoteJid, { 
        text: runtimeMessage,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "BONY-XMD UPTIME ⏱️",
                body: `Active for: ${uptime}`,
                thumbnailUrl: "https://files.catbox.moe/2h0jb0.jpg", 
                sourceUrl: "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
};
