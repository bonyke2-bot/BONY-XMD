const { getSetting } = require("../lib/settings.cjs");
const QRCode = require("qrcode");

module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const data = text.trim().split(/\s+/).slice(1).join(" ");

  if (!data) {
    return sock.sendMessage(jid, {
      text: "📱 *BONY XMD QR GENERATOR*\n\nUsage: `" + (getSetting("prefix") || ".") + "qr <text or link>`\n\nExample:\n`" + (getSetting("prefix") || ".") + "qr https://github.com`"
    }, { quoted: msg });
  }

  try {
    const buffer = await QRCode.toBuffer(data, {
      type: "png",
      width: 800,
      margin: 2
    });

    await sock.sendMessage(jid, {
      image: buffer,
      caption: `📱 *BONY XMD QR CODE*\n\n🔗 ${data}`
    }, { quoted: msg });

  } catch (error) {
    console.error("QR error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to generate the QR code."
    }, { quoted: msg });
  }
};
