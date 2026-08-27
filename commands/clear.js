module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;

    try {
        // Reaction 🧹
        await sock.sendMessage(chatId, { react: { text: "🧹", key: m.key } });

        // 1. Send a status message before clearing
        await sock.sendMessage(chatId, { 
            text: "╭━━━〔 *RIFT-MD CLEAR CHAT* 〕━━━⡱\n┃ 🧹 *Status:* Cleaning up this chat...\n┃ 🤖 *Bot:* RIFT-MD\n╰━━━━━━━━━━━━━━━━━━━━⬣" 
        }, { quoted: m });

        // 2. Modify the chat to delete history on the bot's end
        await sock.chatModify({
            delete: true,
            lastMessages: [{ 
                key: m.key, 
                messageTimestamp: m.messageTimestamp 
            }]
        }, chatId);

        // Success Reaction ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

        /* Note: This clears the chat history from the bot's perspective. 
           It does not delete messages for other members in a group chat.
        */

    } catch (error) {
        console.error("Clear Chat Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ *Error:* I am unable to clear this chat at the moment." 
        }, { quoted: m });
    }
};
