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

    let text = `╭━━━〔 👑 GROUP ADMINS 〕━━━╮\n`;
    text += `┃ 👥 Group: ${metadata.subject}\n`;
    text += `┃ 👑 Total Admins: ${admins.length}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

    admins.forEach((admin, index) => {
      text += `${index + 1}. @${admin.id.split("@")[0]}\n`;
    });

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ admins error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to get group admins."
    });
  }
};
