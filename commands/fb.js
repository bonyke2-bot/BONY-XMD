// Useful functions
function isUrl(u) {
  return typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim());
}

function cleanUrl(u) {
  if (!isUrl(u)) return null;
  return u.trim().replace(/\s+/g, "");
}

async function getJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    }
  });
  const data = await response.json();
  return { status: response.status, data: data };
}

async function fetchThumbAsBuffer(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (e) {
    console.log("Thumbnail error:", e);
  }
  return undefined;
}

// --- MAIN COMMAND ---
module.exports = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const url = args[0];

  // Check for URL
  if (!url) {
    return await sock.sendMessage(chatId, {
      text: `*亗 QUEEN COLAMBIA 亗*\n\n❌ *Error:* Please provide a Facebook link.\n💡 *Usage:* .fb [link]`,
    }, { quoted: m });
  }

  const lower = url.toLowerCase();
  if (!lower.includes("facebook.com") && !lower.includes("fb.watch")) {
    return await sock.sendMessage(chatId, { text: "❌ *Invalid Link:* Please use a real Facebook URL." }, { quoted: m });
  }

  // Progress Reaction
  await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

  try {
    const apiUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
    const res = await getJson(apiUrl);

    if (res.status !== 200 || !res.data.status) {
      await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
      return await sock.sendMessage(chatId, { text: "❌ *Service Error:* I couldn't fetch this video. Try again later." }, { quoted: m });
    }

    const media = res.data.data.media || {};
    const videoUrl = cleanUrl(media.download) || cleanUrl(media.video);
    const thumb = cleanUrl(res.data.data.thumbnail);

    if (!videoUrl) {
      await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
      return await sock.sendMessage(chatId, { text: "❌ *Not Found:* Could not extract the download link." }, { quoted: m });
    }

    // New Stylish Caption
    const caption = 
      `┏━━━━━━━━━━━━━━━━━━┓\n` +
      `┃   🎬  *FB DOWNLOADER* \n` +
      `┠━━━━━━━━━━━━━━━━━━┫\n` +
      `┃ ✅ *Status:* Success\n` +
      `┃ 👑 *Bot:* QUEEN COLAMBIA\n` +
      `┃ 👤 *Requested by:* @${m.key.participant ? m.key.participant.split('@')[0] : m.key.remoteJid.split('@')[0]}\n` +
      `┗━━━━━━━━━━━━━━━━━━┛`;

    let thumbBuffer = thumb ? await fetchThumbAsBuffer(thumb) : undefined;
    
    await sock.sendMessage(chatId, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: caption,
      mentions: [m.key.participant || m.key.remoteJid],
      jpegThumbnail: thumbBuffer
    }, { quoted: m });

    // Success Reaction
    await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("FB Download error:", e);
    await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
    await sock.sendMessage(chatId, { text: "❌ *Fatal Error:* Something went wrong." }, { quoted: m });
  }
};
