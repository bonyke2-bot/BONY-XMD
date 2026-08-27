const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, m) {
    const chatId = m.key.remoteJid;

    try {
        // 1. Identify the quoted message
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await sock.sendMessage(chatId, { 
                text: '❌ *Usage:* Please reply to a **View Once** image or video.' 
            }, { quoted: m });
        }

        // 2. Extract content from View Once layers (V2 is the most common now)
        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || quoted;
        const messageContent = viewOnce.message || viewOnce;
        
        // Detect media type
        const type = Object.keys(messageContent)[0];

        if (!type || (!type.includes('imageMessage') && !type.includes('videoMessage'))) {
            return await sock.sendMessage(chatId, { 
                text: '❌ *Error:* This is not a View Once media file.' 
            }, { quoted: m });
        }

        // 3. Add a processing reaction
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // 4. Download the media stream
        const media = messageContent[type];
        const stream = await downloadContentFromMessage(
            media, 
            type.replace('Message', '').replace('viewOnce', '')
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = `👁️ *VIEW ONCE RECOVERED*\n👑 *QUEEN COLAMBIA V3*`;

        // 5. Send the recovered file back
        if (type.includes('image')) {
            await sock.sendMessage(chatId, { 
                image: buffer, 
                caption: caption 
            }, { quoted: m });
        } else if (type.includes('video')) {
            await sock.sendMessage(chatId, { 
                video: buffer, 
                caption: caption, 
                mimetype: 'video/mp4' 
            }, { quoted: m });
        }

        // 6. Final success reaction
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("View Once Recovery Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: '⚠️ *System Error:* Failed to download the media. It might have expired.' 
        }, { quoted: m });
    }
}

module.exports = viewonceCommand;
