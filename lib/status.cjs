const { getAllSettings } = require("./settings.cjs");

const isStatusMessage = (msg) => {
  return msg?.key?.remoteJid === "status@broadcast";
};

async function handleStatus(sock, msg) {
  if (!isStatusMessage(msg)) return;

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
      await sock.sendMessage("status@broadcast", {
        react: {
          text: settings.statusReaction || "👻",
          key: msg.key
        }
      });

      console.log(
        `👻 BONY-XMD reacted to a status with ${settings.statusReaction || "👻"}`
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
