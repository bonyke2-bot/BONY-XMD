module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    let target;

    if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (jid.endsWith("@g.us")) {
      target = jid;
    } else {
      target = msg.key.participant || jid;
    }

    const url = await sock.profilePictureUrl(target, "image");

    if (!url) {
      return sock.sendMessage(jid, {
        text: "❌ No profile picture found."
      });
    }

    await sock.sendMessage(jid, {
      image: { url },
      caption: `🖼️ Profile picture`
    });
  } catch (error) {
    console.error("❌ getpp error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to get the profile picture."
    });
  }
};
