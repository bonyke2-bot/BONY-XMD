const { getSetting } = require("../lib/settings.cjs");

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

  const name = text.trim().split(/\s+/).slice(1).join(" ");

  if (!name) {
    return sock.sendMessage(jid, {
      text: "✏️ *SET GROUP NAME*\n\nUsage: `" + (getSetting("prefix") || ".") + "setname <new group name>`"
    }, { quoted: msg });
  }

  try {
    await sock.groupUpdateSubject(jid, name);

    await sock.sendMessage(jid, {
      text: `✅ Group name changed to:\n*${name}*`
    }, { quoted: msg });

  } catch (error) {
    console.error("Setname error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to change the group name.\n\nMake sure the bot is a group admin."
    }, { quoted: msg });
  }
};
