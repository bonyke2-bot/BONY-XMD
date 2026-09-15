module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const sent = await sock.sendMessage(
    jid,
    { text: "🔍 *BONY-XMD BODY COUNT SCANNER*\n\n📡 Connecting to scanner..." },
    { quoted: msg }
  );

  const update = async (text) => {
    await sock.sendMessage(jid, {
      text,
      edit: sent.key
    });
  };

  const steps = [
    ["⏳ Initializing scan...", 1200],
    ["🔎 Searching available data...", 1200],
    ["...........", 900],
    ["........", 900],
    ["...", 900],
    ["🧬 Analyzing results...", 1200],
    ["📊 Calculating body count...", 1200],
    ["🔐 Verifying results...", 1200],
    ["⚠️ Almost complete...", 1200],
    ["████████████████ 100%", 1000]
  ];

  for (const [text, delay] of steps) {
    await sleep(delay);
    await update(`🔍 *BONY-XMD BODY COUNT SCANNER*\n\n${text}`);
  }

  await sleep(1500);

  await update(
    "✅ *SCAN COMPLETED!*\n\n" +
    "📋 *Final result:*\n" +
    "👤 Body count detected: *82* 🤫😂\n\n" +
    "💀 *BONY-XMD knows everything...*\n" +
    "😏 *Why you like sex?* 😂💜"
  );
};
