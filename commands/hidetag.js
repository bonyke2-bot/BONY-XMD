module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;

    const channelInfo = {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407561123100@newsletter',
                newsletterName: 'RIFT-MD',
                serverMessageId: -1
            }
        }
    };

    // 1. Check if it is a group
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { 
            text: "❌ *This command can only be used in groups!*", 
            ...channelInfo 
        }, { quoted: m });
    }

    try {
        // 2. Get group metadata and all participants
        const groupMetadata = await sock.groupMetadata(chatJid);
        const participants = groupMetadata.participants;
        
        // 3. Get the text written after the hidetag command
        const messageText = args.join(" ") || "📢 *Attention everyone!*";

        // 4. Send the message with an invisible mention for all participants
        await sock.sendMessage(chatJid, { 
            text: messageText, 
            mentions: participants.map(a => a.id),
            ...channelInfo 
        });

    } catch (err) {
        console.error("Hidetag Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Failed to retrieve participant list. Make sure the bot is an admin!*", 
            ...channelInfo 
        }, { quoted: m });
    }
};
