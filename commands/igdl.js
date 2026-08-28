const axios = require('axios');
const settings = require('../settings');

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

// ===============================
// SERVER 1 - VREDEN
// ===============================
async function vreden(url) {
    const { data } = await axios.get(
        `https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`,
        axiosConfig
    );
    if (data?.result && data.result.length > 0 && data.result[0].url) {
        return { url: data.result[0].url };
    }
    throw new Error("Vreden failed");
}

// ===============================
// SERVER 2 - YUPRA
// ===============================
async function yupra(url) {
    const { data } = await axios.get(
        `https://api.yupra.my.id/api/downloader/igdl?url=${encodeURIComponent(url)}`,
        axiosConfig
    );
    if (data?.success && data?.data?.download_url) {
        return { url: data.data.download_url };
    }
    throw new Error("Yupra failed");
}

// ===============================
// SERVER 3 - OKATSU
// ===============================
async function okatsu(url) {
    const { data } = await axios.get(
        `https://okatsu-rolezapiiz.vercel.app/downloader/igdl?url=${encodeURIComponent(url)}`,
        axiosConfig
    );
    if (data?.result?.video) {
        return { url: data.result.video };
    }
    throw new Error("Okatsu failed");
}

// ===============================
// SERVER 4 - ELITEPROTECH
// ===============================
async function eliteProTech(url) {
    const { data } = await axios.get(
        `https://eliteprotech-apis.zone.id/igdl?url=${encodeURIComponent(url)}`,
        axiosConfig
    );
    if (data?.success && data?.downloadURL) {
        return { url: data.downloadURL };
    }
    throw new Error("EliteProTech failed");
}

// ===============================
// MAIN COMMAND
// ===============================
module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const url = args[0];

        if (!url || !url.includes('instagram.com')) {
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

        const servers = [
            { name: "Vreden", function: vreden },
            { name: "Yupra", function: yupra },
            { name: "Okatsu", function: okatsu },
            { name: "EliteProTech", function: eliteProTech }
        ];

        let mediaData = null;

        for (const server of servers) {
            try {
                console.log(`Trying ${server.name}...`);
                const result = await server.function(url);
                if (result && result.url) {
                    mediaData = result;
                    console.log(`${server.name} SUCCESS`);
                    break;
                }
            } catch (error) {
                console.log(`${server.name} FAILED:`, error.message);
            }
        }

        if (!mediaData) {
            throw new Error("All Instagram download servers failed");
        }

        await sock.sendMessage(
            chatId,
            {
                video: { url: mediaData.url },
                caption:
                    `╭━━━〔 *RIFT-MD INSTAGRAM* 〕━━━⬣\n` +
                    `┃ 🎬 *Downloaded by RIFT-MD*\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━⬣`,
                ...channelInfo
            },
            { quoted: m }
        );

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
                    "⚠️ All servers are currently unavailable or timed out.",
                ...channelInfo
            },
            { quoted: m }
        );
    }
};
