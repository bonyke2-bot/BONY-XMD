module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const message =
`🔞 *BONY-KE BODY COUNT SCANNER* 😁

🔍 Scanning...
💻 Checking records...
📡 Connecting to database...
📊 Body counts found: *744* 😭😂

🤣 Don't panic!

🎭 *It was just a prank by BONY XMD!*

❤️ Continue enjoying our bot.`;

  await sock.sendMessage(jid, {
    text: message
  }, { quoted: msg });
};
