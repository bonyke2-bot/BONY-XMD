module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const prefix = m.message?.conversation?.charAt(0) || '.';
    const query = args.join(" ");

    if (!query) {
        return await sock.sendMessage(chatId, { 
            text: `╭━━━〔 *RIFT-MD YOUTUBE SEARCH* 〕━━━⡱\n┃ ❌ *Please provide a search query!*\n┃ 💡 *Example:* \`${prefix}yts Alan Walker\`\n╰━━━━━━━━━━━━━━━━━━━━⬣` 
        }, { quoted: m });
    }

    try {
        // Reaction "🔎" while searching
        await sock.sendMessage(chatId, { react: { text: "🔎", key: m.key } });

        const searchApi = `https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(query)}`;
        const response = await fetch(searchApi);
        const data = await response.json();

        if (!data.result || data.result.length === 0) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ *Error:* No results found for your search query." }, { quoted: m });
        }

        const list = data.result.slice(0, 5); // Take top 5 results
        let text = `╭━━━〔 *YOUTUBE SEARCH RESULTS* 〕━━━⡱\n┃ 🔎 *Query:* ${query}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
        
        list.forEach((v, i) => {
            text += `*${i + 1}.* 📌 *Title:* ${v.title}\n`;
            text += `⏱️ *Duration:* ${v.duration || v.timestamp || 'N/A'}\n`;
            text += `🔗 *Link:* ${v.url}\n\n`;
        });

        text += `> _💡 Use .play [song name] to download the audio._`;

        await sock.sendMessage(chatId, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "RIFT-MD YOUTUBE SEARCH",
                    body: `Top results for: ${query}`,
                    thumbnailUrl: list[0].image || list[0].thumbnail || "",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: list[0].url
                }
            }
        }, { quoted: m });

        // Success reaction
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("YouTube Search Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Critical Error:* Failed to fetch YouTube search results." }, { quoted: m });
    }
};
