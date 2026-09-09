const { igdl } = require("ruhend-scraper");
const settings = require("../settings.cjs");

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "0029Vb8coEnKAwEcRBDDnq0Z@newsletter",
            newsletterName: "BONY XMD",
            serverMessageId: -1
        }
    }
};

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const url = args[0];

        if (!url || !url.includes("instagram.com")) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
                        `❌ *Please provide a valid Instagram link!*\n\n` +
                        `💡 *Example:* \`${settings.prefix}igdl https://www.instagram.com/reel/...\``,
                    ...channelInfo
                },
                { quoted: m }
            );
        }

        await sock.sendMessage(chatId, {
            react: { text: "⏳", key: m.key }
        });

        const downloadData = await igdl(url);

        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            return await sock.sendMessage(
                chatId,
                {
                    text: "❌ *No media found!* The link may be private or broken.",
                    ...channelInfo
                },
                { quoted: m }
            );
        }

        // Retire duplikasyon
        const seenUrls = new Set();
        const uniqueMedia = downloadData.data.filter(media => {
            if (!media.url || seenUrls.has(media.url)) return false;
            seenUrls.add(media.url);
            return true;
        });

        const mediaList = uniqueMedia.slice(0, 10);

        for (let i = 0; i < mediaList.length; i++) {
            try {
                const media = mediaList[i];
                const mediaUrl = media.url;

                const isVideo =
                    /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
                    media.type === "video" ||
                    url.includes("/reel/") ||
                    url.includes("/tv/");

                const caption =
                    `╭━━━〔 *BONY-XMD INSTAGRAM* 〕━━━⬣\n` +
                    `┃ 🎬 *Downloaded by BONY-XMD*\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━⬣`;

                if (isVideo) {
                    await sock.sendMessage(
                        chatId,
                        {
                            video: { url: mediaUrl },
                            mimetype: "video/mp4",
                            caption,
                            ...channelInfo
                        },
                        { quoted: m }
                    );
                } else {
                    await sock.sendMessage(
                        chatId,
                        {
                            image: { url: mediaUrl },
                            caption,
                            ...channelInfo
                        },
                        { quoted: m }
                    );
                }

                if (i < mediaList.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }

            } catch (err) {
                console.error(`Media ${i + 1} error:`, err.message);
            }
        }

        await sock.sendMessage(chatId, {
            react: { text: "✅", key: m.key }
        });

    } catch (error) {
        console.error("IGDL COMMAND ERROR:", error);

        await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
        });

        await sock.sendMessage(
            chatId,
            {
                text:
                    "❌ *Failed to download Instagram video!*\n\n" +
                    "⚠️ The link may be private or unavailable.",
                ...channelInfo
            },
            { quoted: m }
        );
    }
};