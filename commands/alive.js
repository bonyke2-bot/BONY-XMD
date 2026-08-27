module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Calculate response speed (Latency)
    const start = Date.now();
    const latency = Date.now() - start;

    const aliveTemplate = `*───「 ＱＵＥＥＮ  ＳＴＡＴＵＳ 」───*

🚀 *Latency:* ${latency} _ms_
🛰️ *Server:* _Online_
⚙️ *Version:* _3.0.0_
💎 *System:* _Operational_

*──────────────────────*
*Queen Colambia is active and responding.*`.trim();

    // 2. Send the status card with a professional preview
    await sock.sendMessage(remoteJid, { 
        text: aliveTemplate,
        contextInfo: {
            externalAdReply: {
                title: "QUEEN COLAMBIA V3",
                body: "System is Operational 💎",
                thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });

    // 3. Send the audio file as a Voice Note (PTT)
    await sock.sendMessage(remoteJid, { 
        audio: { url: "https://files.catbox.moe/pframr.mp3" }, 
        mimetype: 'audio/mp4', 
        ptt: true 
    }, { quoted: m });
};
