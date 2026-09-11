const { getSetting } = require("../lib/settings.cjs");

module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    const now = new Date();
    const timezone = getSetting("timezone") || "Africa/Nairobi";

    const time = now.toLocaleTimeString("en-KE", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    const date = now.toLocaleDateString("en-KE", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 🕐 BONY TIME 〕━━━╮
┃ 📅 ${date}
┃ 🕐 ${time}
┃ 🌍 ${timezone}
╰━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ time error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to get the current time."
    });
  }
};
