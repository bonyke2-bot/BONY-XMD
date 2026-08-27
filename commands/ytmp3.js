module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: "👑 *QUEEN COLAMBIA*\n\n⚠️ Tanpri mete yon lyen YouTube oswa non yon mizik.\n\n*Egzanp:* .ytmp3 Bob Marley Is This Love"
        }, { quoted: m });
    }

    try {
        let videoUrl = query;
        let title = "Music";
        let thumb = "";

        // 1. Reyaji pou montre bot la ap travay
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // 2. Si se pa yon lyen, nou chèche l via API
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const sRes = await fetch(`https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(query)}`);
            const sData = await sRes.json();
            
            if (!sData.result || sData.result.length === 0) {
                await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
                return await sock.sendMessage(chatId, { text: `❌ Mwen pa jwenn anyen pou: ${query}` });
            }
            videoUrl = sData.result[0].url;
            title = sData.result[0].title;
            thumb = sData.result[0].image || sData.result[0].thumbnail;
        }

        // 3. Rele API David Cyril la ak fetch
        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const resJson = await response.json();
        const data = resJson?.result;

        if (!data || !data.download_url) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ API a pa ka jwenn odyo a. Eseye ankò pita." });
        }

        // 4. Voye Odyo a
        await sock.sendMessage(chatId, {
            audio: { url: data.download_url },
            mimetype: "audio/mpeg",
            fileName: `${data.title || title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: data.title || title,
                    body: "QUEEN COLAMBIA MUSIC",
                    thumbnailUrl: data.thumbnail || thumb,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // 5. Reaction final
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Erè YTMP3:", error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ Yon erè rive. API a ka gen yon pwoblèm." });
    }
};
