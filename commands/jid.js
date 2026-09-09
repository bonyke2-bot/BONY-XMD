module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const context = msg.message?.extendedTextMessage?.contextInfo;

  const target =
    context?.participant ||
    context?.mentionedJid?.[0] ||
    jid;

  await sock.sendMessage(jid, {
    text:
`╭━━━〔 🆔 JID 〕━━━╮
┃ 📱 JID:
┃ ${target}
╰━━━━━━━━━━━━━━━━╯`
  });
};
