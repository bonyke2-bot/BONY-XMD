const fs = require("fs");
const path = require("path");
const {
  getAllSettings,
} = require("./settings.cjs");

const DOWNLOAD_DIR = path.join(__dirname, "..", "status");

function ensureStatusDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

function isStatusMessage(msg) {
  return msg?.key?.remoteJid === "status@broadcast";
}

async function handleStatus(sock, msg) {
  const settings = getAllSettings();

  if (!settings.statusEnabled) return;
  if (!isStatusMessage(msg)) return;

  try {
    // 👀 Auto-view
    if (settings.statusAutoView) {
      await sock.readMessages([msg.key]);
    }

    // ❤️ Auto-react
    if (settings.statusAutoReact) {
      await sock.sendMessage("status@broadcast", {
        react: {
          text: settings.reaction || "❤️",
          key: msg.key,
        },
      });
    }

    console.log("🟢 STATUS DETECTED:", msg.key.participant || "Unknown");

    // 📥 Download is prepared separately so we don't
    // download every status unless explicitly enabled.
    if (settings.statusDownload) {
      ensureStatusDir();
      console.log("📥 Status download mode enabled.");
    }

    // 💬 Reply is intentionally handled separately.
    // WhatsApp status replies depend on the status message type
    // and should not blindly send a normal chat message.
  } catch (error) {
    console.error("❌ Status handler error:", error.message);
  }
}

module.exports = {
  handleStatus,
  isStatusMessage,
};
