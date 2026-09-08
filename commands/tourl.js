const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');

async function getStreamBuffer(stream) {
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        let mediaMessage = null;
        let mediaType = '';

        if (m.message?.imageMessage) { mediaMessage = m.message.imageMessage; mediaType = 'image'; }
        else if (m.message?.videoMessage) { mediaMessage = m.message.videoMessage; mediaType = 'video'; }
        else if (m.message?.audioMessage) { mediaMessage = m.message.audioMessage; mediaType = 'audio'; }
        else if (quoted?.imageMessage) { mediaMessage = quoted.imageMessage; mediaType = 'image'; }
        else if (quoted?.videoMessage) { mediaMessage = quoted.videoMessage; mediaType = 'video'; }
        else if (quoted?.documentMessage) { mediaMessage = quoted.documentMessage; mediaType = 'document'; }

        if (!mediaMessage) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *[ BONY-XMD ] Please reply (quote) to an image, video, or audio to get the URL!*` 
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        const typeStr = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'document';
        const stream = await downloadContentFromMessage(mediaMessage, typeStr);
        const buffer = await getStreamBuffer(stream);

        const form = new FormData();
        form.append('file', buffer, { filename: 'file.' + (mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'mp3' : 'jpg') });

        const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        let fileUrl = response.data?.data?.url;
        if (fileUrl) {
            fileUrl = fileUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }

        if (!fileUrl) {
            throw new Error('Upload failed to generate link');
        }

        const resultText = `╭━━━〔 *BONY-XMD UPLOADER* 〕━━━⬣
┃ ✅ *Success!*
┃ 🔗 *URL:* ${fileUrl}
╰━━━━━━━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(chatId, { text: resultText }, { quoted: m });
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("ToUrl Detailed Error:", err.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: `⚠️ *[ BONY-XMD ] Error: Failed during upload process.*` }, { quoted: m });
    }
};
