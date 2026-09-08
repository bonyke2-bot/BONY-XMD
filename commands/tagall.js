module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;

    // 1. Check if the command is used in a group
    if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Access Denied:* This command can only be used inside groups!" 
        }, { quoted: m });
    }

    try {
        // Reaction to show it's processing
        await sock.sendMessage(chatId, { react: { text: "📢", key: m.key } });

        // 2. Fetch group metadata and participants
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const groupName = groupMetadata.subject;
        
        // 3. Prepare the message text and mentions array
        let teks = `╭━━━〔 *ANNOUNCEMENT* 〕━━━⡱\n┃ 📢 *Group:* ${groupName}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
        let mentions = [];

        for (let mem of participants) {
            teks += ` 🔹 @${mem.id.split('@')[0]}\n`;
            mentions.push(mem.id); // Crucial for triggering notifications on their phones
        }

        teks += `\n> _©️ Powered by BONY-XMD MULTI-DEVICE_`;

        // 4. Send the message with all mentions
        await sock.sendMessage(
            chatId,
            { 
                text: teks, 
                mentions: mentions 
            },
            { quoted: m }
        );

    } catch (error) {
        console.error("Tagall Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ *Error:* Failed to fetch group members. Please try again later." 
        }, { quoted: m });
    }
};
