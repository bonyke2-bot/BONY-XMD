const yts = require('yt-search');
const axios = require('axios');
const settings = require("../settings");

// Channel configuration for Rift Md
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363407561123100@newsletter',
            newsletterName: 'RIFT-MD',
            serverMessageId: -1
        }
    }
};

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const searchQuery = args.join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Please provide a song name or YouTube link!*\n💡 *Example:* \`${settings.prefix}play Bob Marley Is This Love\``,
                ...channelInfo
            }, { quoted: m });
        }

        // Reaction "⏳" while searching
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // Search for the song using yt-search
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { 
                text: "❌ *No results found for your query!*",
                ...channelInfo
            }, { quoted: m });
        }

        const video = videos[0];
        const urlYt = video.url;

        // Information text format styled for Queen Colambia
        const infoText = `╭━━━〔 *RIFT-MD MUSIC* 〕━━━⬣
┃ 🎵 *Title:* ${video.title}
┃ 🕒 *Duration:* ${video.timestamp}
┃ 👁️ *Views:* ${video.views.toLocaleString()}
┃ 🤖 *Bot:* RIFT-MD 
╰━━━━━━━━━━━━━━━━━━━━⬣

> ⚡ *Downloading instantly (Audio + Document)...*`.trim();

        // Send info message and fetch API data concurrently for maximum speed
        const [, response] = await Promise.all([
            sock.sendMessage(chatId, { text: infoText, ...channelInfo }, { quoted: m }),
            axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`)
        ]);

        const data = response.data;
        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { 
                text: "❌ *Failed to fetch audio from the server. Please try again later.*",
                ...channelInfo
            }, { quoted: m });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title || video.title;
        const cleanTitle = title.replace(/[^\w\s]/gi, ''); // Sanitize filename for safety

        // Send both Audio and Document simultaneously in parallel for lightning-fast delivery
        await Promise.all([
            // 1. Send as an Audio Player with External Ad Reply
            sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${cleanTitle}.mp3`,
                contextInfo: {
                    ...channelInfo.contextInfo,
                    externalAdReply: {
                        title: title,
                        body: "QUEEN COLAMBIA MULTIMEDIA",
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: urlYt,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m }),

            // 2. Send as a Document File
            sock.sendMessage(chatId, {
                document: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${cleanTitle}.mp3`,
                caption: `🎵 *${title}* (Document Format)`,
                ...channelInfo
            }, { quoted: m })
        ]);

        // Success reaction "✅"
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error('Error in play command:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ *Download failed. Extraction server error or time-out!*",
            ...channelInfo
        }, { quoted: m });
    }
};
