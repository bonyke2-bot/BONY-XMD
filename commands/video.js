// --- API SOURCES (MODIFYE POU FETCH) ---
async function getEliteProTechVideoByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data?.success && data?.downloadURL) {
        return { download: data.downloadURL, title: data.title };
    }
    throw new Error('EliteProTech failed');
}

async function getYupraVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data?.success && data?.data?.download_url) {
        return { download: data.data.download_url, title: data.data.title };
    }
    throw new Error('Yupra failed');
}

// --- MAIN COMMAND ---
module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const searchQuery = args.join(" ");

    if (!searchQuery) {
        return await sock.sendMessage(chatId, { text: '📽️ *QUEEN COLAMBIA*\n\nKi videyo ou vle m telechaje?' }, { quoted: m });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';

        if (searchQuery.startsWith('http')) {
            videoUrl = searchQuery;
        } else {
            // Sèvi ak yon API rechèch olye de yt-search
            const sRes = await fetch(`https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(searchQuery)}`);
            const sData = await sRes.json();
            if (!sData.result || sData.result.length === 0) return sock.sendMessage(chatId, { text: '❌ Videyo pa jwenn!' });
            
            videoUrl = sData.result[0].url;
            videoTitle = sData.result[0].title;
            videoThumbnail = sData.result[0].image || sData.result[0].thumbnail;
        }

        // Voye yon ti preview
        await sock.sendMessage(chatId, { 
            image: { url: videoThumbnail || 'https://files.catbox.moe/3dwe96.jpg' }, 
            caption: `🎬 *M ap prepare:* ${videoTitle || searchQuery}\n\n_Tanpri tann..._` 
        }, { quoted: m });

        let videoData;
        let downloadSuccess = false;
        
        // Eseye sous yo youn apre lòt
        try {
            videoData = await getEliteProTechVideoByUrl(videoUrl);
            if (videoData.download) downloadSuccess = true;
        } catch (e) {
            try {
                videoData = await getYupraVideoByUrl(videoUrl);
                if (videoData.download) downloadSuccess = true;
            } catch (err) {
                console.log("Tout API echwe");
            }
        }
        
        if (!downloadSuccess) throw new Error('Tout sous yo echwe.');

        // Voye videyo a
        await sock.sendMessage(chatId, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            caption: `👑 *QUEEN COLAMBIA*\n\n🎥 *Tit:* ${videoData.title || videoTitle}`
        }, { quoted: m });

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: '❌ Erè: Mwen pa ka telechaje videyo sa a kounye a.' });
    }
}
