import { createRequire } from "module";
const require = createRequire(import.meta.url);

const commands = require("./command-loader.cjs");
const {
  getAllSettings,
  getSetting
} = require("./lib/settings.cjs");
const { handleStatus } = require("./lib/status.cjs");
const { sendWithFooter } = require("./lib/footer.cjs");

import { importSession } from "./session-importer.js";
import {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import makeWASocket from "@whiskeysockets/baileys";
import P from "pino";

console.log("🚀 Starting BONY XMD...");

let authState;
let saveCreds;
let sock;
let reconnectTimer;

async function startBonyXmd() {
  if (!authState) {
    await importSession();

    console.log("📁 Loading BONY XMD session...");

    const result = await useMultiFileAuthState("./session");

    authState = result.state;
    saveCreds = result.saveCreds;

    console.log("🔌 Authentication state loaded...");
  }

  console.log("🔌 Creating WhatsApp connection...");

  sock = makeWASocket({
    auth: authState,
    logger: P({ level: "info" })
  });

  sock.ev.on("creds.update", saveCreds);

  if (getSetting("alwaysonline")) {
    try {
      await sock.sendPresenceUpdate("available");
      console.log("🟢 Always Online enabled.");
    } catch (error) {
      console.error("⚠️ Always Online error:", error.message);
    }
  }

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect }) => {
      console.log("Connection status:", connection);

      if (connection === "open") {
        const connectedNumber = sock.user.id.split(":")[0];
        console.log("🔎 ACTUAL CONNECTED ID:", sock.user?.id);
        console.log("╔══════════════════════════════════╗");
        console.log("║       BONY-XMD CONNECTED 🟢      ║");
        console.log(`║       Number: ${connectedNumber}       ║`);
        console.log("║       Online 🟢                  ║");
        console.log("╚══════════════════════════════════╝");
        try {
          await sock.sendMessage(sock.user.id, {
            text: `╭─「 *𝗕𝗢𝗡𝗬 𝗫𝗠𝗗* 」
│ ✅ *𝗢𝗡𝗟𝗜𝗡𝗘*
├──────────────
│ ⚙️ 𝗠𝗼𝗱𝗲: *PUBLIC*
│ ⌨️ 𝗣𝗿𝗲𝗳𝗶𝘅: *.*
│ 📣 *𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹 𝗖𝗵𝗮𝗻𝗻𝗲𝗹*
╰──────────────`,
            contextInfo: {
              externalAdReply: {
                title: "𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹 𝗖𝗵𝗮𝗻𝗻𝗲𝗹",
                body: "Tap to view BONY XMD Channel",
                mediaType: 1,
                sourceUrl: "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z"
              }
            }
          });
          console.log("✅ Connection notification sent to connected number.");
        } catch (error) {
          console.error("⚠️ Failed to send connection notification:", error.message);
        }
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        console.log("❌ BONY XMD connection closed.");

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");

          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }

          reconnectTimer = setTimeout(() => {
            startBonyXmd().catch((error) => {
              console.error("❌ Reconnect error:");
              console.error(error);
            });
          }, 5000);
        } else {
          console.log("⚠️ Session logged out. Pair again.");
        }
      }
    }
  );

  // 🗃️ MESSAGE CACHE FOR DELETE RECOVERY
  const deletedMessageCache = new Map();
  const MAX_CACHED_MESSAGES = 1500;

  function cacheMessage(msg) {
    if (!msg?.message || !msg?.key?.id || !msg?.key?.remoteJid) return;

    const cacheKey = `${msg.key.remoteJid}:${msg.key.id}`;

    deletedMessageCache.set(cacheKey, {
      message: msg.message,
      key: msg.key,
      timestamp: Date.now()
    });

    if (deletedMessageCache.size > MAX_CACHED_MESSAGES) {
      const oldestKey = deletedMessageCache.keys().next().value;
      if (oldestKey) deletedMessageCache.delete(oldestKey);
    }
  }

  function getCachedMessage(key) {
    if (!key?.id || !key?.remoteJid) return null;

    const cacheKey = `${key.remoteJid}:${key.id}`;
    return deletedMessageCache.get(cacheKey) || null;
  }

  // 🗑️ DELETED MESSAGE DETECTOR
  sock.ev.on("messages.update", async (updates) => {
    const deleteSettings = getAllSettings();

    if (!deleteSettings.antiDelete) return;

    for (const item of updates) {
      const update = item.update;
      const protocolType =
        update?.message?.protocolMessage?.type;

      if (protocolType !== 0) continue;

      const deletedKey =
        update?.message?.protocolMessage?.key ||
        update?.key;

      if (!deletedKey?.id || !deletedKey?.remoteJid) continue;

      const cached = getCachedMessage(deletedKey);
      const inbox = sock.user?.id;

      if (!inbox) continue;

      const isGroup = deletedKey.remoteJid.endsWith("@g.us");

      let chatName = deletedKey.remoteJid;

      if (isGroup) {
        try {
          const metadata = await sock.groupMetadata(deletedKey.remoteJid);
          chatName = metadata?.subject || "Unknown Group";
        } catch {
          chatName = "Unknown Group";
        }
      }

      const sender =
        deletedKey.participant ||
        deletedKey.remoteJid ||
        "Unknown";

      let originalText = "⚠️ Original content was not cached.";

      if (cached?.message) {
        originalText =
          cached.message.conversation ||
          cached.message.extendedTextMessage?.text ||
          cached.message.imageMessage?.caption ||
          cached.message.videoMessage?.caption ||
          cached.message.documentMessage?.caption ||
          "[Media / unsupported message type]";
      }

      const notification = `╭─「 🗑️ *MESSAGE DELETED* 」
│ ${isGroup ? "👥 GROUP" : "👤 PRIVATE"}
│ 📍 ${chatName}
│ 👤 Sender: ${sender}
│ 🆔 ID: ${deletedKey.id}
├──────────────
│ 📝 Original:
│ ${originalText}
╰──────────────`;

      try {
        await sock.sendMessage(inbox, {
          text: notification
        });

        console.log("🗑️ Deleted message forwarded to BONY inbox.");
      } catch (error) {
        console.error("❌ Delete notification error:", error.message);
      }

      deletedMessageCache.delete(
        `${deletedKey.remoteJid}:${deletedKey.id}`
      );
    }
  });

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {
      const currentSettings = getAllSettings();

      for (const msg of messages) {
        if (!msg.message) continue;

        // 🗃️ Save message so deleted content can be recovered
        cacheMessage(msg);

        // 🗃️ STATUS HANDLER
        try {
          await handleStatus(sock, msg);
        } catch (error) {
          console.error("❌ Status processing error:", error.message);
        }

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) continue;

        if (currentSettings.autoread) {
          try {
            await sock.readMessages([msg.key]);
          } catch (error) {
            console.error("⚠️ Autoread error:", error.message);
          }
        }

        if (currentSettings.autoreact && !msg.key.fromMe) {
          try {
            await sock.sendMessage(
              msg.key.remoteJid,
              {
                react: {
                  text: currentSettings.reaction || "❤️",
                  key: msg.key
                }
              }
            );
          } catch (error) {
            console.error("⚠️ Autoreact error:", error.message);
          }
        }

        if (currentSettings.autotyping) {
          try {
            await sock.sendPresenceUpdate(
              "composing",
              msg.key.remoteJid
            );
          } catch (error) {
            console.error("⚠️ Autotyping error:", error.message);
          }
        }

        if (currentSettings.autorecording) {
          try {
            await sock.sendPresenceUpdate(
              "recording",
              msg.key.remoteJid
            );
          } catch (error) {
            console.error("⚠️ Autorecording error:", error.message);
          }
        }

        console.log(
          "📨 RECEIVED TEXT:",
          JSON.stringify(text)
        );

        console.log(
          "👤 SENDER:",
          msg.key.remoteJid,
          "FROM ME:",
          msg.key.fromMe
        );

        // PRIVATE MODE: only owner/fromMe can use bot commands
        if (
          currentSettings.mode === "private" &&
          !msg.key.fromMe &&
          msg.key.remoteJid !== "254748339103@s.whatsapp.net"
        ) {
          continue;
        }

        const trimmed = text.trim();

        const currentPrefix = getSetting("prefix") || ".";

        if (!trimmed.startsWith(currentPrefix)) continue;

        const prefix = currentPrefix;

        const body = trimmed.slice(prefix.length).trim();

        if (!body) continue;

        const parts = body.split(/\s+/);
        const commandName = parts.shift().toLowerCase();
        console.log(`🧪 COMMAND DETECTED: ${commandName} from ${msg.key.remoteJid}`);
        const args = parts;

        const command = commands.get(commandName);

        if (!command) {
          console.log(`⚠️ Unknown command: ${commandName}`);
          continue;
        }

        try {
          console.log(
            `⚡ Running command: ${prefix}${commandName}`
          );

          const commandSock = new Proxy(sock, {
            get(target, prop) {
              if (prop === "sendMessage") {
                return async (jid, content, options) => {
                  if (
                    content &&
                    typeof content === "object" &&
                    typeof content.text === "string" &&
                    !content.buttons &&
                    !content.image &&
                    !content.video &&
                    !content.audio &&
                    !content.sticker &&
                    !content.document
                  ) {
                    return sendWithFooter(target, jid, content.text, options);
                  }

                  return target.sendMessage(jid, content, options);
                };
              }

              return target[prop];
            }
          });

          await command(commandSock, msg, args);

          console.log(
            `✅ Command completed: ${prefix}${commandName}`
          );
        } catch (error) {
          console.error(
            `❌ Command error: ${commandName}`
          );
          console.error(error);

          try {
            await sock.sendMessage(
              msg.key.remoteJid,
              {
                text:
                  "❌ An error occurred while running that command."
              },
              { quoted: msg }
            );
          } catch (sendError) {
            console.error(
              "❌ Could not send error message:",
              sendError
            );
          }
        }
      }
    }
  );
}

startBonyXmd().catch((error) => {
  console.error("❌ BONY XMD ERROR:");
  console.error(error);
});
