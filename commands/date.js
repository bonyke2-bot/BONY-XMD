const { getSetting } = require("../lib/settings.cjs");

module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    const now = new Date();
    const timezone = getSetting("timezone") || "Africa/Nairobi";

    const date = now.toLocaleDateString("en-KE", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 📅 BONY DATE 〕━━━╮
┃ 📅 ${date}
┃ 🌍 ${timezone}
╰━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ date error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to get today's date."
    });
  }
};
