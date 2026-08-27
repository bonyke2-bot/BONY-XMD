
module.exports = async (sock, m, args) => {
    const text = args.slice(1).join(" ");
    const lang = args[0]; // Egzanp: .translate en Bonjou

    if (!text || !lang) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: "👑 *QUEEN COLAMBIA*\n\n❌ Fòma: .translate [lang] [tèks]\n*Egzanp:* .translate en Bonjou" 
        });
    }

    // Reaction ⏳
    await sock.sendMessage(m.key.remoteJid, { react: { text: "🌎", key: m.key } });

    try {
        const apiUrl = `https://api.popcat.xyz/translate?to=${lang}&text=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.translated) {
            return sock.sendMessage(m.key.remoteJid, { text: "❌ Mwen pa ka tradui tèks sa a kounye a." });
        }

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🌎 *TRADIKSYON (${lang.toUpperCase()}):* \n\n${data.translated}` 
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("Translate Error:", e);
        sock.sendMessage(m.key.remoteJid, { text: "❌ Erè rive nan tradiksyon an. API a ka gen pwoblèm." });
    }
}
