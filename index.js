require("dotenv").config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["BONY-XMD", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ BONY-XMD connected to WhatsApp!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ WhatsApp connection closed.");

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("⚠️ Logged out. Delete the session folder and reconnect.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const message = messages[0];

    if (!message?.message) return;

    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    if (text === ".ping") {
      await sock.sendMessage(message.key.remoteJid, {
        text: "🏓 Pong! BONY-XMD is alive."
      });
    }
  });
}

startBot().catch((error) => {
  console.error("❌ Failed to start BONY-XMD:", error);
});
