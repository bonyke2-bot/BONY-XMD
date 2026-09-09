module.exports = async (sock, msg, args) => {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, {
      text: "❌ This command can only be used in a group."
    });
  }

  const action = (args[0] || "").toLowerCase();

  if (!["on", "off"].includes(action)) {
    return sock.sendMessage(jid, {
      text: "📢 Usage:\n!groupannounce on\n!groupannounce off"
    });
  }

  try {
    const metadata = await sock.groupMetadata(jid);

    const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
    const bot = metadata.participants.find(p => p.id === botJid);

    if (!bot?.admin) {
      return sock.sendMessage(jid, {
        text: "❌ I must be a group admin to change this setting."
      });
    }

    const announce = action === "on";

    await sock.groupSettingUpdate(
      jid,
      announce ? "announcement" : "not_announcement"
    );

    await sock.sendMessage(jid, {
      text: announce
        ? "🔒 *Group locked.* Only admins can send messages."
        : "🔓 *Group unlocked.* All members can send messages."
    });
  } catch (error) {
    console.error("❌ groupannounce error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to change the group setting."
    });
  }
};
