const { getSetting } = require("../lib/settings.cjs");

module.exports = async (sock, msg, args) => {
  const jid = msg.key.remoteJid;
  let number = args.join("").replace(/\D/g, "");

  if (!number) {
    return sock.sendMessage(jid, {
      text: "📱 Usage: " + (getSetting("prefix") || ".") + "contact 2547XXXXXXXX"
    });
  }

  if (number.startsWith("0")) {
    number = "254" + number.slice(1);
  }

  if (number.length < 10) {
    return sock.sendMessage(jid, {
      text: "❌ Please provide a valid WhatsApp number."
    });
  }

  try {
    const result = await sock.onWhatsApp(`${number}@s.whatsapp.net`);

    if (!result?.[0]?.exists) {
      return sock.sendMessage(jid, {
        text: `❌ ${number} is not registered on WhatsApp.`
      });
    }

    await sock.sendMessage(jid, {
      text:
`╭━━━〔 📱 CONTACT 〕━━━╮
┃ 📞 Number: ${number}
┃ ✅ WhatsApp: Yes
┃ 🆔 JID: ${result[0].jid}
╰━━━━━━━━━━━━━━━━━━╯`
    });
  } catch (error) {
    console.error("❌ contact error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Unable to check this number."
    });
  }
};
