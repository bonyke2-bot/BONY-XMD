module.exports = async (sock, m, args) => {
    const url = args[0];
    if (!url) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: "👑 *QUEEN COLAMBIA*\n\n🔗 Tanpri mete lyen Twitter (X) la!" 
        });
    }

    // Reaction 🐦
    await sock.sendMessage(m.key.remoteJid, { react: { text: "🐦", key: m.key } });

    try {
        const apiUrl = `https://apis.davidcyriltech.my.id/download/twitter?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const res = await response.json();
        
        const data = res.result;

        if (!data || !data.video_url) {
            await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
            return sock.sendMessage(m.key.remoteJid, { text: "❌ Mwen pa jwenn okenn videyo nan lyen sa a." });
        }

        await sock.sendMessage(m.key.remoteJid, { 
            video: { url: data.video_url }, 
            caption: `👑 *QUEEN COLAMBIA*\n\n✅ *Twitter Video*\n\n📌 *Desc:* ${data.description || "No title"}` 
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("Twitter DL Error:", e);
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        sock.sendMessage(m.key.remoteJid, { text: "❌ Erè: Lyen an pa valid oswa API a gen pwoblèm." });
    }
}
