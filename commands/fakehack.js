module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const lines = [
    "💻 *BONY-KE-HACK TOOLKIT V2*",
    "",
    "🔎 Hacking......💻",
    "⚙️ Generated user .... documents 💻",
    "📂 Found details.........💻",
    "",
    "😂 *PRANK COMPLETE!*",
    "",
    "🎭 It was a prank by *BONY XMD*",
    "❤️ Continue enjoying our bot!"
  ];

  let output = "";

  for (const line of lines) {
    output += line + "\n";
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await sock.sendMessage(jid, {
    text: output
  }, { quoted: msg });
};
