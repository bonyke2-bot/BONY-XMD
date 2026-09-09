module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    const now = new Date();

    const time = now.toLocaleTimeString("en-KE", {
      timeZone: "Africa/Nairobi",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    const date = now.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
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
┃ 🌍 Africa/Nairobi
╰━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ time error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to get the current time."
    });
  }
};
