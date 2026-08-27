const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

const tryRequest = async (getter, attempts = 3) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            if (attempt === attempts) throw err;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
};

const getEliteProTechVideoByUrl = async (youtubeUrl) => {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const { success, downloadURL: download, title } = res?.data || {};
    if (success && download) return { download, title };
    throw new Error('EliteProTech ytdown returned no download');
};

const getYupraVideoByUrl = async (youtubeUrl) => {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const { success, data } = res?.data || {};
    if (success && data?.download_url) {
        return { download: data.download_url, title: data.title, thumbnail: data.thumbnail };
    }
    throw new Error('Yupra returned no download');
};

const getOkatsuVideoByUrl = async (youtubeUrl) => {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const { mp4: download, title } = res?.data?.result || {};
    if (download) return { download, title };
    throw new Error('Okatsu ytmp4 returned no mp4');
};

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const searchQuery = args.join(" ").trim();

    if (!searchQuery) {
        return await sock.sendMessage(chatId, { text: '❌ Please provide a video name or YouTube link!' }, { quoted: m });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        let videoUrl = '';
        let videoTitle = '';

        if (/^https?:\/\//.test(searchQuery)) {
            videoUrl = searchQuery;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
                return await sock.sendMessage(chatId, { text: '❌ No videos found!' }, { quoted: m });
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
        }

        let videoData;
        const apiMethods = [
            { name: 'EliteProTech', run: () => getEliteProTechVideoByUrl(videoUrl) },
            { name: 'Yupra', run: () => getYupraVideoByUrl(videoUrl) },
            { name: 'Okatsu', run: () => getOkatsuVideoByUrl(videoUrl) }
        ];

        for (const api of apiMethods) {
            try {
                const res = await api.run();
                if (res?.download || res?.dl || res?.url) {
                    videoData = res;
                    break;
                }
            } catch (err) {
                console.log(`${api.name} API failed:`, err.message);
            }
        }

        if (!videoData) {
            throw new Error('All download sources failed.');
        }

        const finalUrl = videoData.download || videoData.dl || videoData.url;
        const finalTitle = videoData.title || videoTitle || 'video';

        await sock.sendMessage(chatId, {
            video: { url: finalUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[^\w\s-]/g, '')}.mp4`,
            caption: `🎬 *${finalTitle}*`
        }, { quoted: m });

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error('Video Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: m });
    }
};
