module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const context =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo ||
    {};

  const quotedParticipant = context.participant;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  let target = quotedParticipant || text.trim().split(/\s+/)[1];

  if (!target) {
    return sock.sendMessage(jid, {
      text: "🛡️ *BONY XMD UNBLOCK*\n\nReply to a person's message or use:\n`!unblock 2547XXXXXXXX`"
    }, { quoted: msg });
  }

  if (!target.includes("@")) {
    target = target.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  }

  try {
    await sock.updateBlockStatus(target, "unblock");

    await sock.sendMessage(jid, {
      text: `✅ Successfully unblocked:\n*${target}*`
    }, { quoted: msg });

  } catch (error) {
    console.error("Unblock error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to unblock that contact."
    }, { quoted: msg });
  }
};
