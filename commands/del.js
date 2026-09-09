module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const context = msg.message?.extendedTextMessage?.contextInfo;

  if (!context?.stanzaId) {
    return sock.sendMessage(jid, {
      text: "❌ Reply to the message you want me to delete."
    });
  }

  try {
    await sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: context.participant
          ? context.participant === sock.user?.id
          : false,
        id: context.stanzaId,
        participant: context.participant
      }
    });

    console.log("🗑️ Message deleted.");
  } catch (error) {
    console.error("❌ del error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ I couldn't delete that message. I may need admin permission."
    });
  }
};
