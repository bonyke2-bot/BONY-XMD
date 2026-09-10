const CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z";

async function sendWithFooter(sock, jid, text, options = {}) {
  return sock.sendMessage(
    jid,
    {
      text: `${text}\n\n━━━━━━━━━━━━━━\n📢 BONY XMD`
    },
    options
  );
}

module.exports = {
  CHANNEL_URL,
  sendWithFooter
};
