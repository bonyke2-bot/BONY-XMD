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
        text: "❌ No admins found."
      });
    }

    const mentions = admins.map(p => p.id);

    const text =
      `👑 *GROUP ADMINS*\n\n` +
      admins.map((admin, i) =>
        `${i + 1}. @${admin.id.split("@")[0]}`
      ).join("\n");

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ tagadmins error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to tag group admins."
    });
  }
};
