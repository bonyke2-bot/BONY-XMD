module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  try {
    const context =
      msg.message?.extendedTextMessage?.contextInfo;

    const target =
      context?.participant ||
      context?.mentionedJid?.[0] ||
      msg.key.participant ||
      jid;

    const number = target.split("@")[0];

    let name = "Unknown";

    try {
      const contact = await sock.onWhatsApp(target);
      if (contact?.[0]?.exists) {
        name = contact[0].name || contact[0].notify || "Unknown";
      }
    } catch {}

    let profile = "Unavailable";

    try {
      profile = await sock.profilePictureUrl(target, "image");
    } catch {}

    const text =
`╭━━━〔 👤 WHOIS 〕━━━╮
┃ 📱 Number: ${number}
┃ 👤 Name: ${name}
┃ 🖼️ Profile: ${profile !== "Unavailable" ? "Available" : "Unavailable"}
┃ 🆔 JID: ${target}
╰━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(jid, { text });
  } catch (error) {
    console.error("❌ whois error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to retrieve user information."
    });
  }
};
