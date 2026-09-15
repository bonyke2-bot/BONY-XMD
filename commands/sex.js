module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const send = async (text) => {
    await sock.sendMessage(
      jid,
      { text },
      { quoted: msg }
    );
  };

  await send("🔍 *BONY-XMD BODY COUNT SCANNER*");

  await sleep(1200);
  await send("📡 Connecting to scanner...");

  await sleep(1200);
  await send("⏳ Initializing scan...");

  await sleep(1200);
  await send("🔎 Searching available data...");

  await sleep(900);
  await send("...........");

  await sleep(900);
  await send("........");

  await sleep(900);
  await send("...");

  await sleep(1200);
  await send("🧬 Analyzing results...");

  await sleep(1200);
  await send("📊 Calculating body count...");

  await sleep(1200);
  await send("🔐 Verifying results...");

  await sleep(1200);
  await send("⚠️ Almost complete...");

  await sleep(1000);
  await send("████████████████ 100%");

  await sleep(1500);
  await send(
    "✅ *SCAN COMPLETED!*\n\n" +
    "📋 *Final result:*\n" +
    "👤 Body count detected: *CLASSIFIED* 🤫😂\n\n" +
    "💀 *BONY-XMD knows too much...* 😂💜"
  );
};
