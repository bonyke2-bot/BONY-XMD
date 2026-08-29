const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const settings = require("../settings");

async function downloadMedia(message, type) {
    let stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if the user executing the command is the Owner
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;
    if (!isOwner) return sock.sendMessage(from, { text: "❌ This command is for the bot owner only." }, { quoted: m });

    const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const textFromArgs = args ? args.join(' ') : '';
    const textFromQuote = quotedMessage?.conversation || 
                          quotedMessage?.extendedTextMessage?.text || 
                          quotedMessage?.imageMessage?.caption || 
                          quotedMessage?.videoMessage?.caption || '';
    
    let teks = textFromArgs || textFromQuote;
    let media = null;
    let type = null;

    if (quotedMessage) {
        if (quotedMessage.imageMessage) {
            type = "image";
            media = await downloadMedia(quotedMessage.imageMessage, "image");
        } else if (quotedMessage.videoMessage) {
            type = "video";
            media = await downloadMedia(quotedMessage.videoMessage, "video");
        } else if (quotedMessage.audioMessage) {
            type = "audio";
            media = await downloadMedia(quotedMessage.audioMessage, "audio");
        }
    }

    if (!media && !teks) {
        return sock.sendMessage(from, { text: "❌ Please provide a message or reply to a media.\nExample: .gstatut Hello everyone!" }, { quoted: m });
    }

    try {
        const getGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(getGroups);

        await sock.sendMessage(from, { text: `🚀 Sending status to ${groupIds.length} groups...` }, { quoted: m });

        let successCount = 0;

        for (let id of groupIds) {
            try {
                const groupMetadata = await sock.groupMetadata(id);
                let peserta = groupMetadata.participants.map(v => v.id);

                if (!media) {
                    await sock.sendMessage(id, { 
                        text: teks,
                        contextInfo: { mentionedJid: peserta, isGroupStatus: true }
                    }, { backgroundColor: "#7c3aed", statusJidList: peserta });
                } else if (type === "image") {
                    await sock.sendMessage(id, {
                        image: media,
                        caption: teks,
                        contextInfo: { mentionedJid: peserta, isGroupStatus: true }
                    }, { statusJidList: peserta });
                } else if (type === "video") {
                    await sock.sendMessage(id, {
                        video: media,
                        caption: teks,
                        contextInfo: { mentionedJid: peserta, isGroupStatus: true }
                    }, { statusJidList: peserta });
                } else if (type === "audio") {
                    await sock.sendMessage(id, {
                        audio: media,
                        mimetype: "audio/mp4",
                        ptt: false,
                        contextInfo: { mentionedJid: peserta, isGroupStatus: true }
                    }, { statusJidList: peserta });
                }

                successCount++;
                await new Promise(res => setTimeout(res, 2000));
            } catch (err) {
                console.log(`Failed to send to: ${id}`);
            }
        }

        await sock.sendMessage(from, { text: `✅ Status sent successfully to ${successCount} groups!` }, { quoted: m });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: "❌ An error occurred." }, { quoted: m });
    }
};
