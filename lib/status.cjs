const { getAllSettings } = require("./settings.cjs");

const isStatusMessage = (msg) => {
  return msg?.key?.remoteJid === "status@broadcast";
};

async function handleStatus(sock, msg) {
  if (!isStatusMessage(msg)) return;
  if (msg?.key?.fromMe) return;

  const settings = getAllSettings();

  // 👀 AUTO VIEW STATUS
  if (settings.statusAutoView) {
    try {
      await sock.readMessages([msg.key]);
      console.log("👀 BONY-XMD viewed a status.");
    } catch (error) {
      console.error("❌ Status auto-view error:", error.message);
    }
  }

  // 👻 STATUS AUTO REACT
  if (settings.statusAutoReact) {
    try {
        const statusEmojis = ["❤️", "😂", "😮", "😢", "🙏", "🔥", "👏", "😍", "🥰", "😘", "🤩", "👍", "🎉", "💯", "🤣"];
            const randomEmoji = statusEmojis[Math.floor(Math.random() * statusEmojis.length)];
            const statusSender =
          msg.key.participantPn ||
            msg.key.participant ||
            msg.participantPn ||
            msg.participant;

        await sock.sendMessage(
          "status@broadcast",
          {
            react: {
              text: randomEmoji,
              key: msg.key
            }
          },
          {
            statusJidList: statusSender ? [statusSender] : []
          }
        );

      console.log(
        `👻 BONY-XMD reacted to a status with ${randomEmoji}`
      );
    } catch (error) {
      console.error("❌ Status auto-react error:", error.message);
    }
  }
}

module.exports = {
  handleStatus,
  isStatusMessage,
};
