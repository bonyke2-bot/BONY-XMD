const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;

    try {
        const message = m.message;

        // Get the quoted/replied message
        const quoted =
            message?.extendedTextMessage?.contextInfo?.quotedMessage;

        let media = null;
        let type = null;

        // Check if an image/video was sent directly
        if (message?.imageMessage) {
            media = message.imageMessage;
            type = 'image';
        } else if (message?.videoMessage) {
            media = message.videoMessage;
            type = 'video';
        }

        // Check if an image/video was replied to
        if (!media && quoted) {
            if (quoted.imageMessage) {
                media = quoted.imageMessage;
                type = 'image';
            } else if (quoted.videoMessage) {
                media = quoted.videoMessage;
                type = 'video';
            }
        }

        // No media found
        if (!media) {
            return await sock.sendMessage(chatId, {
                text:
                    `❌ *Please reply to an image or video!*\n\n` +
                    `💡 *Example:*\n` +
                    `• Reply to an image → .s\n` +
                    `• Reply to an image → .sticker`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, {
            text: `⏳ *Creating your sticker...*`
        }, { quoted: m });

        const time = Date.now();

        const inputFile = path.join(
            __dirname,
            `sticker_input_${time}.${type === 'image' ? 'jpg' : 'mp4'}`
        );

        const outputFile = path.join(
            __dirname,
            `sticker_output_${time}.webp`
        );

        // Download media
        const stream = await downloadContentFromMessage(
            media,
            type
        );

        const chunks = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        fs.writeFileSync(
            inputFile,
            Buffer.concat(chunks)
        );

        let command;

        // IMAGE → STICKER
        if (type === 'image') {
            command =
                `ffmpeg -y -i "${inputFile}" ` +
                `-vf "scale=512:512:force_original_aspect_ratio=decrease,` +
                `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0" ` +
                `-c:v libwebp -q:v 70 "${outputFile}"`;
        }

        // VIDEO → STICKER
        else {
            command =
                `ffmpeg -y -i "${inputFile}" ` +
                `-t 10 ` +
                `-vf "scale=512:512:force_original_aspect_ratio=decrease,` +
                `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0,fps=15" ` +
                `-c:v libwebp -loop 0 -an "${outputFile}"`;
        }

        exec(command, async (error) => {

            try {

                if (error) {
                    console.error(
                        'FFmpeg Sticker Error:',
                        error
                    );

                    return await sock.sendMessage(chatId, {
                        text:
                            `❌ *Unable to create the sticker!*\n\n` +
                            `Please make sure *FFmpeg* is installed on the server.`
                    }, { quoted: m });
                }

                if (!fs.existsSync(outputFile)) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ *Sticker file was not created.*`
                    }, { quoted: m });
                }

                // SEND STICKER
                await sock.sendMessage(chatId, {
                    sticker: fs.readFileSync(outputFile)
                }, { quoted: m });

            } catch (err) {

                console.error(
                    'Sticker Send Error:',
                    err
                );

                await sock.sendMessage(chatId, {
                    text:
                        `❌ *An error occurred while sending the sticker.*`
                }, { quoted: m });

            } finally {

                // Clean up temporary files
                try {
                    if (fs.existsSync(inputFile)) {
                        fs.unlinkSync(inputFile);
                    }

                    if (fs.existsSync(outputFile)) {
                        fs.unlinkSync(outputFile);
                    }
                } catch (cleanupError) {
                    console.error(
                        'Cleanup Error:',
                        cleanupError
                    );
                }
            }
        });

    } catch (error) {

        console.error(
            'Sticker Command Error:',
            error
        );

        await sock.sendMessage(chatId, {
            text:
                `❌ *Error while creating the sticker.*`
        }, { quoted: m });
    }
};
