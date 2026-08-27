module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const senderJid = m.sender || m.key.participant || m.key.remoteJid;
    
    const startTime = Date.now();
    const sentMsg = await sock.sendMessage(chatId, { text: "Pong! 🏓" }, { quoted: m });
    const latency = Date.now() - start;

    const defaultChannelJid = "120363407561123100@newsletter";

    const pingText = `╭━━━〔 *RIFT-MD PING & JID* 〕━━━⬣
┃ ⚡ *Latency:* \`${latency}ms\`
┃ 👤 *Sender JID:* \`${senderJid}\`
┃ 📢 *Channel JID:* \`${defaultChannelJid}\`
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣`;

    await sock.sendMessage(chatId, { text: pingText, edit: sentMsg.key });
};
