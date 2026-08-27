module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    const prefix = body.charAt(0);
    const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

    // Support multiple command triggers: .twitter, .twdl, .x
    if (command !== 'twitter' && command !== 'twdl' && command !== 'x') return;

    const url = args[0];

    if (!url || !url.includes('twitter.com') && !url.includes('x.com')) {
        return await sock.sendMessage(chatId, { 
            text: `👑 *RIFT-MD - TWITTER DOWNLOADER*\n\n❌ *Please provide a valid Twitter (X) link!*\n💡 *Example:* \`${prefix}${command} https://x.com/...\`` 
        }, { quoted: m });
    }

    try {
        // Reaction 🐦
        await sock.sendMessage(chatId, { react: { text: "🐦", key: m.key } });

        const apiUrl = `https://apis.davidcyriltech.my.id/download/twitter?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const res = await response.json();
        
        const data = res?.result;

        if (!data || !data.video_url) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ *Error:* No video found from this link or the post is private." }, { quoted: m });
        }

        const caption = `╭━━━〔 *RIFT-MD X DOWNLOADER* 〕━━━⡱
┃ 📥 *Status:* Downloaded Successfully ✅
┃ 📝 *Description:* ${data.description || "No description available"}
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(chatId, { 
            video: { url: data.video_url }, 
            caption: caption 
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Twitter DL Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Critical Error:* Failed to fetch video. The API might be down or link is invalid." }, { quoted: m });
    }
};
