module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const created = metadata.creation
      ? new Date(metadata.creation * 1000).toLocaleString()
      : "Unknown";

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 📅 GROUP CREATED 〕━━━╮
┃ 👥 Group: ${metadata.subject}
┃ 📅 Created: ${created}
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ groupcreated error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to retrieve the group creation date."
    });
  }
};
