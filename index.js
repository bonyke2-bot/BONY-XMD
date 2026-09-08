import { importSession } from "./session-importer.js";
import {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const makeWASocket =
  require("@whiskeysockets/baileys").default;

import P from "pino";

console.log("🚀 Starting BONY XMD...");

async function startBonyXmd() {
  await importSession();
  console.log("📁 Loading BONY XMD session...");

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  console.log("🔌 Creating WhatsApp connection...");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "info" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    console.log("Connection status:", connection);

    if (connection === "open") {
      console.log("╔════════════════════════════╗");
      console.log("║      BONY XMD CONNECTED    ║");
      console.log("║      Owner: BONY KE        ║");
      console.log("╚════════════════════════════╝");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ BONY XMD connection closed.");

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBonyXmd();
      } else {
        console.log("⚠️ Session logged out. Pair again.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 BONY XMD is online!"
      });
    }
  });
}

startBonyXmd().catch((error) => {
  console.error("❌ BONY XMD ERROR:");
  console.error(error);
});
