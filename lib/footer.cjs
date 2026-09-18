const CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z";

async function sendWithFooter(sock, jid, text, options = {}) {
  return sock.sendMessage(
    jid,
    {
      text: `${text}\n\n╭─⌈ \`BONY XMD\` ⌋\n│\n│ ✧ *Powered by* : BONY KE 🇱🇹\n╰────────────`
    },
    options
  );
}

module.exports = {
  CHANNEL_URL,
  sendWithFooter
};
