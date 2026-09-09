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

    if (!admins.length) {
      return sock.sendMessage(jid, {
        text: "❌ No group admins found."
      });
    }

    const mentions = admins.map(p => p.id);

    const text =
`╭━━━〔 👑 ADMINS 〕━━━╮
┃ 👥 Group: ${metadata.subject}
┃ 👑 Count: ${admins.length}
╰━━━━━━━━━━━━━━━━━━╯

${admins.map((p, i) =>
  `${i + 1}. @${p.id.split("@")[0]}`
).join("\n")}`;

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ groupadmins error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to retrieve group admins."
    });
  }
};
