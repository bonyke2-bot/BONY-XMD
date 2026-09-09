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
      text: "🛡️ *BONY XMD BLOCK*\n\nReply to a person's message or use:\n`!block 2547XXXXXXXX`"
    }, { quoted: msg });
  }

  if (!target.includes("@")) {
    target = target.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  }

  try {
    await sock.updateBlockStatus(target, "block");

    await sock.sendMessage(jid, {
      text: `🚫 Successfully blocked:\n*${target}*`
    }, { quoted: msg });

  } catch (error) {
    console.error("Block error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to block that contact."
    }, { quoted: msg });
  }
};
