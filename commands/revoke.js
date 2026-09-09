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
        text: "❌ I must be a group admin to revoke the invite."
      });
    }

    const code = await sock.groupRevokeInvite(jid);

    const link = `https://chat.whatsapp.com/${code}`;

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 🔄 INVITE REVOKED 〕━━━╮
┃ 👥 Group: ${metadata.subject}
┃ 🔐 Old invite: Revoked
╰━━━━━━━━━━━━━━━━━━━━━━╯

🔗 *New Invite:*
${link}`
    });
  } catch (error) {
    console.error("❌ revoke error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to revoke the group invite."
    });
  }
};
