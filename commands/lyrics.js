module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const query = text.trim().split(/\s+/).slice(1).join(" ");

  if (!query) {
    return sock.sendMessage(jid, {
      text: "🎵 *BONY XMD LYRICS*\n\nUsage: `!lyrics <artist> - <song>`\n\nExample:\n`!lyrics Ed Sheeran - Perfect`"
    }, { quoted: msg });
  }

  const parts = query.split(/\s+-\s+/);

  if (parts.length < 2) {
    return sock.sendMessage(jid, {
      text: "❌ Use this format:\n`!lyrics Artist - Song`\n\nExample:\n`!lyrics Ed Sheeran - Perfect`"
    }, { quoted: msg });
  }

  const artist = parts[0].trim();
  const song = parts.slice(1).join(" - ").trim();

  try {
    await sock.sendMessage(jid, {
      text: `🎵 Searching lyrics for *${artist} - ${song}*...`
    }, { quoted: msg });

    const url =
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Lyrics not found");
    }

    const data = await response.json();

    if (!data.lyrics) {
      throw new Error("Lyrics unavailable");
    }

    const lyrics = data.lyrics.trim();

    const maxLength = 6000;
    const output = lyrics.length > maxLength
      ? lyrics.slice(0, maxLength) + "\n\n⚠️ Lyrics shortened."
      : lyrics;

    await sock.sendMessage(jid, {
      text:
`🎵 *BONY XMD LYRICS*

🎤 Artist: *${artist}*
🎶 Song: *${song}*

${output}`
    }, { quoted: msg });

  } catch (error) {
    console.error("Lyrics error:", error.message);

    await sock.sendMessage(jid, {
      text: `❌ Lyrics for *${artist} - ${song}* could not be found.`
    }, { quoted: msg });
  }
};
