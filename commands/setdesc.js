module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command only works in groups."
    }, { quoted: msg });
  }

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const description = text.trim().split(/\s+/).slice(1).join(" ");

  if (!description) {
    return sock.sendMessage(jid, {
      text: "📝 *SET GROUP STATUS*\n\nUsage: `!setdesc <new group status>`"
    }, { quoted: msg });
  }

  try {
    await sock.groupUpdateDescription(jid, description);

    await sock.sendMessage(jid, {
      text: `✅ Group status updated!\n\n📝 *${description}*`
    }, { quoted: msg });

  } catch (error) {
    console.error("Setdesc error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to update the group status.\n\nMake sure the bot is a group admin."
    }, { quoted: msg });
  }
};
