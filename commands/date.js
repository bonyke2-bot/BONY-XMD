module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    const now = new Date();

    const date = now.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 📅 BONY DATE 〕━━━╮
┃ 📅 ${date}
┃ 🌍 Africa/Nairobi
╰━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ date error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to get today's date."
    });
  }
};
