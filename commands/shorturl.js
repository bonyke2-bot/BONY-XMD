const { getSetting } = require("../lib/settings.cjs");
module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const url = text.trim().split(/\s+/)[1];

  if (!url) {
    return sock.sendMessage(jid, {
      text: "🔗 *BONY XMD URL SHORTENER*\n\nUsage: `" + (getSetting("prefix") || ".") + "shorturl <link>`\n\nExample:\n`" + (getSetting("prefix") || ".") + "shorturl https://example.com/very/long/link`"
    }, { quoted: msg });
  }

  try {
    new URL(url);
  } catch {
    return sock.sendMessage(jid, {
      text: "❌ Please provide a valid URL."
    }, { quoted: msg });
  }

  try {
    const api = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
    const response = await fetch(api);

    if (!response.ok) {
      throw new Error("Shortener unavailable");
    }

    const shortUrl = (await response.text()).trim();

    if (!shortUrl.startsWith("http")) {
      throw new Error("Invalid response");
    }

    await sock.sendMessage(jid, {
      text: `🔗 *BONY XMD URL SHORTENER*\n\n📎 Original:\n${url}\n\n✨ Shortened:\n${shortUrl}`
    }, { quoted: msg });

  } catch (error) {
    console.error("Short URL error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Failed to shorten the URL. Please try again later."
    }, { quoted: msg });
  }
};
