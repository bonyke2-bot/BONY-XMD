module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    const prefix = body.charAt(0) || ".";
    const query = args.join(" ");

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: `╭━━━〔 *RIFT-MD YTMP3* 〕━━━⡱\n┃ ⚠️ *Please provide a YouTube link or song name!*\n┃ 💡 *Example:* \`${prefix}ytmp3 Alan Walker Faded\`\n╰━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m });
    }

    try {
        let videoUrl = query;
        let title = "Audio Track";
        let thumb = "https://files.catbox.moe/yg3xc1.png";

        // 1. React with loading icon
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // 2. If it's not a direct YouTube URL, search for it via API
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const sRes = await fetch(`https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(query)}`);
            const sData = await sRes.json();
            
            if (!sData.result || sData.result.length === 0) {
                await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
                return await sock.sendMessage(chatId, { text: "❌ *Error:* No results found for your search query." }, { quoted: m });
            }
            videoUrl = sData.result[0].url;
            title = sData.result[0].title;
            thumb = sData.result[0].image || sData.result[0].thumbnail || thumb;
        }

        // 3. Fetch audio download stream from David Cyril API
        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const resJson = await response.json();
        const data = resJson?.result;

        if (!data || !data.download_url) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ *Error:* Failed to extract audio stream. The API might be down." }, { quoted: m });
        }

        const finalTitle = data.title || title;
        const finalThumb = data.thumbnail || thumb;

        // 4. Send the audio file with professional metadata context
        await sock.sendMessage(chatId, {
            audio: { url: data.download_url },
            mimetype: "audio/mpeg",
            fileName: `${finalTitle}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: finalTitle,
                    body: "RIFT-MD AUDIO DOWNLOADER",
                    thumbnailUrl: finalThumb,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // 5. Final success reaction
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("YTMP3 Error:", error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Critical Error:* An unexpected error occurred while processing your request." }, { quoted: m });
    }
};
