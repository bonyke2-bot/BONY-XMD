module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 🆔 GROUP ID 〕━━━╮
┃ 👥 Name: ${metadata.subject}
┃ 🆔 ID: ${jid}
╰━━━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ groupid error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to retrieve the group ID."
    });
  }
};
