const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        // Check if replying to an image, video, or document
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mediaMessage = m.message?.imageMessage || m.message?.videoMessage || m.message?.documentMessage || 
                             quoted?.imageMessage || quoted?.videoMessage || quoted?.documentMessage;

        if (!mediaMessage) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Please reply to an image, video, or document to generate a URL!*` 
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // Download the media file
        const stream = await sock.downloadMediaMessage(mediaMessage);
        const tmpFile = path.join(__dirname, `../tmp_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, stream);

        // Prepare form data for Catbox API
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(tmpFile));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Clean up temporary local file
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

        const fileUrl = response.data;

        if (!fileUrl || !fileUrl.startsWith('http')) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: `❌ *Upload failed! Server error.*` }, { quoted: m });
        }

        // Send the generated URL back to the user
        const resultText = `╭━━━〔 *TO-URL UPLOADER* 〕━━━⬣
┃ ✅ *Uploaded Successfully!*
┃ 🔗 *URL:* ${fileUrl}
╰━━━━━━━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(chatId, { text: resultText }, { quoted: m });
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("ToUrl Error:", err);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: `⚠️ *Error uploading file to server.*` }, { quoted: m });
    }
};
