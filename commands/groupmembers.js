module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const admins = metadata.participants.filter(p => p.admin);
    const members = metadata.participants.filter(p => !p.admin);

    const mentions = metadata.participants.map(p => p.id);

    let text =
`╭━━━〔 👥 GROUP MEMBERS 〕━━━╮
┃ 📌 ${metadata.subject}
┃ 👥 Total: ${metadata.participants.length}
┃ 👑 Admins: ${admins.length}
┃ 👤 Members: ${members.length}
╰━━━━━━━━━━━━━━━━━━━━━━╯

👑 *ADMINS*
${admins.length
  ? admins.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n")
  : "None"}

👤 *MEMBERS*
${members.length
  ? members.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n")
  : "None"}`;

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ groupmembers error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to retrieve group members."
    });
  }
};
