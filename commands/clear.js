module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    try {
        // 1. Send a status message before clearing
        await sock.sendMessage(chatJid, { 
            text: "🧹 *Cleaning up this chat... Please wait.*" 
        }, { quoted: m });

        // 2. Modify the chat to delete all messages on the bot's end
        await sock.chatModify({
            delete: true,
            lastMessages: [{ 
                key: m.key, 
                messageTimestamp: m.messageTimestamp 
            }]
        }, chatJid);

        /* Note: This clears the chat history from the bot's perspective. 
           It does not delete messages for other people in a group 
           unless you use a loop to delete specific message keys.
        */

    } catch (err) {
        console.error("Clear Chat Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "❌ *Error:* I am unable to clear this chat at the moment." 
        });
    }
}
