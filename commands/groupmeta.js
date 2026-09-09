module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const owner = metadata.owner
      ? `@${metadata.owner.split("@")[0]}`
      : "Unknown";

    const description = metadata.desc || "No description";

    const mentions = metadata.owner
      ? [metadata.owner]
      : [];

    const text =
`╭━━━〔 📋 GROUP META 〕━━━╮
┃ 👥 Name: ${metadata.subject}
┃ 🆔 ID: ${metadata.id}
┃ 👑 Owner: ${owner}
┃ 👤 Members: ${metadata.participants.length}
┃ 📅 Created: ${
  metadata.creation
    ? new Date(metadata.creation * 1000).toLocaleString()
    : "Unknown"
}
╰━━━━━━━━━━━━━━━━━━━━━━╯

📝 *Description*
${description}`;

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ groupmeta error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to retrieve group metadata."
    });
  }
};
