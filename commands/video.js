const axios = require("axios");
const yts = require("yt-search");
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

const axiosConfig = {
    timeout: 60000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*"
    }
};

async function request(url) {
    return await axios.get(url, axiosConfig);
}

// ===============================
// ELITE PRO TECH
// ===============================
async function eliteProTech(url) {
    const api =
        `https://eliteprotech-apis.zone.id/ytdown?url=` +
        encodeURIComponent(url) +
        `&format=mp4`;

    const response = await request(api);
    const data = response.data || {};

    if (data.success && data.downloadURL) {
        return { url: data.downloadURL, title: data.title };
    }

    throw new Error("EliteProTech failed");
}

// ===============================
// YUPRA
// ===============================
async function yupra(url) {
    const api =
        `https://api.yupra.my.id/api/downloader/ytmp4?url=` +
        encodeURIComponent(url);

    const response = await request(api);
    const data = response.data || {};

    if (data.success && data.data && data.data.download_url) {
        return {
            url: data.data.download_url,
            title: data.data.title,
            thumbnail: data.data.thumbnail
        };
    }

    throw new Error("Yupra failed");
}

// ===============================
// OKATSU
// ===============================
async function okatsu(url) {
    const api =
        `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=` +
        encodeURIComponent(url);

    const response = await request(api);
    const result = response.data?.result || {};

    if (result.mp4) {
        return { url: result.mp4, title: result.title };
    }

    throw new Error("Okatsu failed");
}

// ===============================
// MAIN COMMAND
// ===============================
module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const query = args.join(" ").trim();

        if (!query) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
                        `❌ *Please provide a video name or YouTube link!*\n\n` +
                        `💡 *Example:* \`${settings.prefix}video Wiz Khalifa See You Again\``,
                    ...channelInfo
                },
                { quoted: m }
            );
        }

        await sock.sendMessage(chatId, {
            react: { text: "⏳", key: m.key }
        });

        let youtubeUrl;
        let searchTitle = "";
        let thumbnail = "";

        if (/^https?:\/\//i.test(query)) {
            youtubeUrl = query;
        } else {
            const search = await yts(query);

            if (!search.videos || search.videos.length === 0) {
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: m.key }
                });

                return await sock.sendMessage(
                    chatId,
                    {
                        text: "❌ *No videos found for your query!*",
                        ...channelInfo
                    },
                    { quoted: m }
                );
            }

            const video = search.videos[0];
            youtubeUrl = video.url || "";
            searchTitle = typeof video.title === "string" ? video.title : (video.title?.toString() || "");
            thumbnail = typeof video.thumbnail === "string" ? video.thumbnail : "";
        }

        const servers = [
            { name: "EliteProTech", function: eliteProTech },
            { name: "Yupra", function: yupra },
            { name: "Okatsu", function: okatsu }
        ];

        let videoData = null;

        for (const server of servers) {
            try {
                console.log(`Trying ${server.name}...`);
                const result = await server.function(youtubeUrl);

                if (result && result.url) {
                    videoData = result;
                    console.log(`${server.name} SUCCESS`);
                    break;
                }
            } catch (error) {
                console.log(`${server.name} FAILED:`, error.message);
            }
        }

        if (!videoData) {
            throw new Error("All video download servers failed");
        }

        const title = videoData.title || searchTitle || "RIFT-MD Video";

        const cleanTitle =
            title
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 100) || "RIFT-MD-Video";

        await sock.sendMessage(
            chatId,
            {
                video: { url: videoData.url },
                mimetype: "video/mp4",
                fileName: `${cleanTitle}.mp4`,
                caption:
                    `╭━━━〔 *RIFT-MD VIDEO* 〕━━━⬣\n` +
                    `┃ 🎬 *Title:* ${title}\n` +
                    `┃ 🤖 *Bot:* RIFT-MD\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━⬣`,
                ...channelInfo
            },
            { quoted: m }
        );

        await sock.sendMessage(chatId, {
            react: { text: "✅", key: m.key }
        });

    } catch (error) {
        console.error("VIDEO COMMAND ERROR:", error);

        await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
        });

        await sock.sendMessage(
            chatId,
            {
                text:
                    "❌ *Video download failed!*\n\n" +
                    "⚠️ All video servers are currently unavailable or timed out.",
                ...channelInfo
            },
            { quoted: m }
        );
    }
};
