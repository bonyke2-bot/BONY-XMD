module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) return sock.sendMessage(from, { text: "🔍 *QUEEN COLAMBIA*\n\nKisa w ap chèche sou YouTube?" }, { quoted: m });

    try {
        // Reyaji pandan l ap chèche
        await sock.sendMessage(from, { react: { text: "🔎", key: m.key } });

        // Nou itilize yon API piblik pou evite yt-search
        const searchApi = `https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(query)}`;
        const response = await fetch(searchApi);
        const data = await response.json();

        if (!data.result || data.result.length === 0) {
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            return sock.sendMessage(from, { text: "❌ Mwen pa jwenn anyen pou rechèch sa a." });
        }

        const list = data.result.slice(0, 5); // Nou pran 5 premye rezilta yo
        let text = `👑 *QUEEN COLAMBIA SEARCH*\n\n🔎 *Rechèch:* ${query}\n\n`;
        
        list.forEach((v, i) => {
            text += `*${i + 1}.* 🏷️ *Tit:* ${v.title}\n`;
            text += `🕒 *Dire:* ${v.duration || v.timestamp}\n`;
            text += `🔗 *Link:* ${v.url}\n\n`;
        });

        text += `*_Sèvi ak .play [non mizik] pou w telechaje odyo a._*`;

        await sock.sendMessage(from, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "YOUTUBE SEARCH RESULTS",
                    body: `Top 5 rezilta pou: ${query}`,
                    thumbnailUrl: list[0].image || list[0].thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // Reaction siksè
        await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        sock.sendMessage(from, { text: "❌ Yon erè rive nan rechèch la." });
    }
}
