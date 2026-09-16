module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const frames = [0, 20, 40, 60, 80, 100];

  const makeText = (progress) => {
    const filled = Math.round(progress / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    return (
      "🔓 *BONY-XMD BODY SCANNER V2* 🎵\n" +
      "──────────────────────\n" +
      "⚠️ WARNING: Secrets, confidence & bad decisions detected! 💀\n" +
      "🔍 Scanning…\n" +
      "🧠 Checking common sense…\n" +
      "🔥 Detecting vibes…\n" +
      "SCAN PROGRESS:\n" +
      `${bar} ${progress}%\n` +
      (progress === 100
        ? "✅ SCAN COMPLETE!\n" +
          "📊 BODY COUNT FOUND: 87 😭🔥\n" +
          "Embarrassed? Blame the scanner! 🤣\n" +
          "🐺 BONY-XMD — exposing absolutely nothing! 👑\n" +
          "😂 This is a prank made by BONY-XMD!"
        : "")
    );
  };

  const sent = await sock.sendMessage(
    jid,
    { text: makeText(0) },
    { quoted: msg }
  );

  for (let i = 1; i < frames.length; i++) {
    await sleep(1200);

    await sock.sendMessage(jid, {
      text: makeText(frames[i]),
      edit: sent.key
    });
  }
};
