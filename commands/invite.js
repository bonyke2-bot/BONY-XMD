module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const botNumber = sock.user?.id?.split(":")[0];
    const bot = metadata.participants.find(
      p => p.id.split("@")[0] === botNumber
    );

    if (!bot?.admin) {
      return sock.sendMessage(jid, {
        text: "❌ I must be a group admin to get the invite link."
      });
    }

    const code = await sock.groupInviteCode(jid);
    const link = `https://chat.whatsapp.com/${code}`;

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 🔗 GROUP INVITE 〕━━━╮
┃ 👥 Group: ${metadata.subject}
╰━━━━━━━━━━━━━━━━━━━━━━╯

${link}`
    });
  } catch (error) {
    console.error("❌ invite error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to generate the group invite link."
    });
  }
};
