module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);
    const members = metadata.participants;

    const mentions = members.map(p => p.id);

    let text =
`╭━━━〔 👥 GROUP MEMBERS 〕━━━╮
┃ 📌 Group: ${metadata.subject}
┃ 👥 Total: ${members.length}
╰━━━━━━━━━━━━━━━━━━━━━━╯

`;

    members.forEach((member, index) => {
      const role = member.admin ? " 👑" : "";
      text += `${index + 1}. @${member.id.split("@")[0]}${role}\n`;
    });

    await sock.sendMessage(jid, {
      text,
      mentions
    });
  } catch (error) {
    console.error("❌ members error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to retrieve group members."
    });
  }
};
