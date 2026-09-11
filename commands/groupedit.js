const { getSetting } = require("../lib/settings.cjs");

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
      text: "⚙️ Usage:\n" + (getSetting("prefix") || ".") + "groupedit on\n" + (getSetting("prefix") || ".") + "groupedit off"
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
        text: "❌ I must be a group admin to change this setting."
      });
    }

    const setting =
      action === "on"
        ? "locked"
        : "unlocked";

    await sock.groupSettingUpdate(jid, setting);

    await sock.sendMessage(jid, {
      text:
        action === "on"
          ? "🔒 *Group settings locked.* Only admins can edit them."
          : "🔓 *Group settings unlocked.* Members can edit them."
    });
  } catch (error) {
    console.error("❌ groupedit error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to change the group settings."
    });
  }
};
