module.exports = async (sock, m) => {
  try {
    const jid = m.key.remoteJid;

    const text = `╭━━━〔 *BONY-XMD* 〕━━━⬣
┃ 🛰️ *Status:* \`Online & Stable\`
┃ ⚙️ *Version:* \`2.0.0\`
┃ 💎 *Platform:* \`Termux / Cloud\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> *BONY-XMD is fully operational and ready to serve.* 💜`;

    await sock.sendMessage(
      jid,
      { text },
      { quoted: m }
    );

    console.log("✅ ALIVE command replied successfully.");
  } catch (error) {
    console.error("❌ Error in alive command:", error);
  }
};
