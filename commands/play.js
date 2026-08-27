module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const text = args.join(" ");

    if (!text) {
        return await sock.sendMessage(chatId, { 
            text: "亗 *QUEEN COLAMBIA* 亗\n\n❌ *Error:* Please provide a song name.\n💡 *Example:* .play Bob Marley Is This Love" 
        }, { quoted: m });
    }

    // Reaction "⏳" pou montre w ap travay
    await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

    try {
        // 1. Chèche mizik la sou YouTube (API rapid)
        const searchRes = await fetch(`https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(text)}`);
        const searchData = await searchRes.json();

        if (!searchData.result || searchData.result.length === 0) {
            return await sock.sendMessage(chatId, { text: "❌ *Error:* No results found." });
        }

        const video = searchData.result[0];
        const videoUrl = video.url;

        // 2. Telechaje Audio a
        const dlRes = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`);
        const dlData = await dlRes.json();

        if (!dlData.result || !dlData.result.download) {
            throw new Error("Download link not found");
        }

        const audioUrl = dlData.result.download;

        const caption = 
            `┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃   🎵  *MUSIC DOWNLOADER* \n` +
            `┠━━━━━━━━━━━━━━━━━━┫\n` +
            `┃ 📝 *Title:* ${video.title}\n` +
            `┃ 🕒 *Duration:* ${video.timestamp}\n` +
            `┃ 👑 *Bot:* QUEEN COLAMBIA\n` +
            `┗━━━━━━━━━━━━━━━━━━┛`;

        // 3. Voye Caption an ak Audio a
        await sock.sendMessage(chatId, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mp4', 
            ptt: false 
        }, { quoted: m });

        await sock.sendMessage(chatId, { text: caption }, { quoted: m });
        
        // Reaction siksè
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("Play Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: "⚠️ *Error:* I couldn't download the song. Please try another title." 
        }, { quoted: m });
    }
};
