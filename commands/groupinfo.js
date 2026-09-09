module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const admins = metadata.participants.filter(p => p.admin).length;

    const text =
`╭━━━〔 GROUP INFO 〕━━━╮
┃ 👥 Name: ${metadata.subject}
┃ 🆔 ID: ${metadata.id}
┃ 👤 Members: ${metadata.participants.length}
┃ 👑 Admins: ${admins}
┃ 📅 Created: ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : "Unknown"}
╰━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(jid, { text });
  } catch (error) {
    console.error("❌ groupinfo error:", error.message);
    await sock.sendMessage(jid, {
      text: "❌ Failed to get group information."
    });
  }
};
