let downloadContentFromMessage;

async function loadBaileys() {
  if (!downloadContentFromMessage) {
    ({ downloadContentFromMessage } = await import("@whiskeysockets/baileys"));
  }
}

const settings = require("../settings.cjs");

async function downloadMedia(message, type) {
  await loadBaileys();

  const stream = await downloadContentFromMessage(message, type);
  let buffer = Buffer.alloc(0);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

module.exports = async (sock, m, args) => {
  const from = m.key.remoteJid;
  const sender = m.key.participant || m.key.remoteJid;

  const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, "");
  const senderNumber = sender.replace(/[^0-9]/g, "");

  const isOwner =
    m.key.fromMe || senderNumber === ownerNumber;

  if (!isOwner) {
    return sock.sendMessage(
      from,
      {
        text: "❌ This command is for the bot owner only."
      },
      { quoted: m }
    );
  }

  const quotedMessage =
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  const textFromArgs = args ? args.join(" ") : "";

  const textFromQuote =
    quotedMessage?.conversation ||
    quotedMessage?.extendedTextMessage?.text ||
    quotedMessage?.imageMessage?.caption ||
    quotedMessage?.videoMessage?.caption ||
    "";

  const teks = textFromArgs || textFromQuote;

  let media = null;
  let type = null;

  if (quotedMessage) {
    if (quotedMessage.imageMessage) {
      type = "image";
      media = await downloadMedia(
        quotedMessage.imageMessage,
        "image"
      );
    } else if (quotedMessage.videoMessage) {
      type = "video";
      media = await downloadMedia(
        quotedMessage.videoMessage,
        "video"
      );
    } else if (quotedMessage.audioMessage) {
      type = "audio";
      media = await downloadMedia(
        quotedMessage.audioMessage,
        "audio"
      );
    }
  }

  if (!media && !teks) {
    return sock.sendMessage(
      from,
      {
        text:
          "❌ Please provide a message or reply to media.\n\n" +
          "Example:\n.gstatut Hello everyone!"
      },
      { quoted: m }
    );
  }

  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);

    if (!groupIds.length) {
      return sock.sendMessage(
        from,
        { text: "❌ Bot is not in any groups." },
        { quoted: m }
      );
    }

    const statusJidList = [];

    for (const id of groupIds) {
      const metadata = await sock.groupMetadata(id);

      for (const participant of metadata.participants) {
        if (participant.id && !statusJidList.includes(participant.id)) {
          statusJidList.push(participant.id);
        }
      }
    }

    await sock.sendMessage(
      from,
      {
        text:
          `🚀 Publishing status...\n\n` +
          `👥 Groups: ${groupIds.length}\n` +
          `👤 Recipients: ${statusJidList.length}`
      },
      { quoted: m }
    );

    const options = {
      statusJidList
    };

    if (!media) {
      await sock.sendMessage(
        "status@broadcast",
        {
          text: teks
        },
        options
      );
    } else if (type === "image") {
      await sock.sendMessage(
        "status@broadcast",
        {
          image: media,
          caption: teks
        },
        options
      );
    } else if (type === "video") {
      await sock.sendMessage(
        "status@broadcast",
        {
          video: media,
          caption: teks
        },
        options
      );
    } else if (type === "audio") {
      await sock.sendMessage(
        "status@broadcast",
        {
          audio: media,
          mimetype: "audio/mp4",
          ptt: false
        },
        options
      );
    }

    await sock.sendMessage(
      from,
      {
        text:
          `✅ Status published successfully!\n\n` +
          `👥 Groups: ${groupIds.length}\n` +
          `👤 Recipients: ${statusJidList.length}`
      },
      { quoted: m }
    );

  } catch (error) {
    console.error("❌ GSTATUT ERROR:", error);

    await sock.sendMessage(
      from,
      {
        text:
          "❌ Failed to publish status.\n\n" +
          `Error: ${error.message}`
      },
      { quoted: m }
    );
  }
};
