const CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z";

async function sendWithFooter(sock, jid, text, options = {}) {
  return sock.sendMessage(
    jid,
    {
      text: `${text}\n\n━━━━━━━━━━━━━━\n📢 BONY XMD`,
      footer: "BONY XMD",
      buttons: [
        {
          buttonId: "!menu",
          buttonText: { displayText: "📋 MENU" },
          type: 1
        },
        {
          buttonId: CHANNEL_URL,
          buttonText: { displayText: "📢 VIEW CHANNEL" },
          type: 1
        }
      ],
      headerType: 1
    },
    options
  );
}

module.exports = {
  CHANNEL_URL,
  sendWithFooter
};
