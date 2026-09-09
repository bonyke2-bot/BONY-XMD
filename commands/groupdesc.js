module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);
    const description = metadata.desc || "No group description set.";

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 📝 GROUP DESCRIPTION 〕━━━╮
┃ 👥 Group: ${metadata.subject}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${description}`
    });
  } catch (error) {
    console.error("❌ groupdesc error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to retrieve the group description."
    });
  }
};
