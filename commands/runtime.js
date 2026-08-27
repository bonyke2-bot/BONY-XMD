
module.exports = async (sock, m) => {
    // Fonksyon pou konvèti segonn yo an fòma ki lizib
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
        
        // Si tout bagay zero, montre omwen 0 segonn
        if (!dDisplay && !hDisplay && !mDisplay && !sDisplay) return "0 seconds";
        
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    const uptime = runtime(process.uptime());

    const runtimeMessage = `
*╭───〔 ⏳ UPTIME INFO 〕───⭐*
│
│ 🚀 *Status:* Active
│ ⏱️ *Runtime:* ${uptime}
│ ⚙️ *System:* Stable
│
*╰──────────────⭐*
    `.trim();

    // Nou voye sèlman tèks la, san contextInfo (AdReply)
    await sock.sendMessage(m.key.remoteJid, { 
        text: runtimeMessage 
    }, { quoted: m });
}
