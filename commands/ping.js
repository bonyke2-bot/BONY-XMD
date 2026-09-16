module.exports = async (sock, m) => {
  const chatId = m.key.remoteJid;
  const start = Date.now();

  const sent = await sock.sendMessage(
    chatId,
    { text: "🏓 Pinging..." },
    { quoted: m }
  );

  const latency = Date.now() - start;

  await sock.sendMessage(chatId, {
    text:
      `╭━━━〔 *BONY-XMD PING* 〕━━━⬣\n` +
      `┃ 🏓 *Pong!*\n` +
      `┃ ⚡ *Speed:* ${latency} ms\n` +
      `┃ 🤖 *Bot:* BONY-XMD\n` +
      `╰━━━━━━━━━━━━━━━━━━━━⬣`,
    edit: sent.key
  });
};
