module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const message = `🔍 *Scanning body count...* 😋😋

✅ *Successfully scanned body count...* 😋

📊 *Found 735 body count...* 😋

.
.
.

😂 *HAHA! It was just a prank by BONY XMD bot!* 💜`;

  await sock.sendMessage(
    jid,
    { text: message },
    { quoted: msg }
  );
};
