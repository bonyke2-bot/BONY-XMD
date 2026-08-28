const yts = require("yt-search");
const axios = require("axios");
const settings = require("../settings");

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363407561123100@newsletter",
            newsletterName: "RIFT-MD",
            serverMessageId: -1
        }
    }
};

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const query = args.join(" ").trim();

        if (!query) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
                        `❌ *Please provide a song name or YouTube link!*\n\n` +
                        `💡 Example: \`${settings.prefix}play Bob Marley Is This Love\``,
                    ...channelInfo
                },
                { quoted: m }
            );
        }

        await sock.sendMessage(chatId, {
            react: {
                text: "⏳",
                key: m.key
            }
        });

        // YouTube search
        const search = await yts(query);

        if (!search.videos || search.videos.length === 0) {
            await sock.sendMessage(chatId, {
                react: {
                    text: "❌",
                    key: m.key
                }
            });

            return await sock.sendMessage(
                chatId,
                {
                    text: "❌ *No results found for your query!*",
                    ...channelInfo
                },
                { quoted: m }
            );
        }

        const video = search.videos[0];
        const youtubeUrl = video.url;

        const views = Number(video.views || 0).toLocaleString();

        const infoText = `
╭━━━〔 *RIFT-MD MUSIC* 〕━━━⬣
┃ 🎵 *Title:* ${video.title}
┃ 🕒 *Duration:* ${video.timestamp}
┃ 👁️ *Views:* ${views}
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣

> ⚡ *Downloading audio...*
        `.trim();

        await sock.sendMessage(
            chatId,
            {
                text: infoText,
                ...channelInfo
            },
            { quoted: m }
        );

        // Encode YouTube URL correctly
        const apiUrl =
            `https://apis-keith.vercel.app/download/dlmp3?url=` +
            encodeURIComponent(youtubeUrl);

        const response = await axios.get(apiUrl, {
            timeout: 60000
        });

        const data = response.data;

        if (
            !data ||
            !data.status ||
            !data.result ||
            !data.result.downloadUrl
        ) {
            throw new Error("Invalid download API response");
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title || video.title;

        const cleanTitle =
            title
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
                .trim()
                .slice(0, 100) || "RIFT-MD-AUDIO";

        // Send audio
        await sock.sendMessage(
            chatId,
            {
                audio: {
                    url: audioUrl
                },
                mimetype: "audio/mpeg",
                fileName: `${cleanTitle}.mp3`,
                contextInfo: {
                    ...channelInfo.contextInfo,
                    externalAdReply: {
                        title: title,
                        body: "RIFT-MD MUSIC",
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: youtubeUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: m }
        );

        await sock.sendMessage(chatId, {
            react: {
                text: "✅",
                key: m.key
            }
        });

    } catch (error) {
        console.error("PLAY COMMAND ERROR:", error);

        await sock.sendMessage(chatId, {
            react: {
                text: "❌",
                key: m.key
            }
        });

        await sock.sendMessage(
            chatId,
            {
                text:
                    "❌ *Download failed!*\n\n" +
                    "⚠️ The YouTube extraction server may be unavailable or timed out.",
                ...channelInfo
            },
            { quoted: m }
        );
    }
};
