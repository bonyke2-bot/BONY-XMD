import http from "http";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const commands = require("./command-loader.cjs");
const {
  getAllSettings,
  getSetting
} = require("./lib/settings.cjs");
const { handleStatus } = require("./lib/status.cjs");

const { sendWithFooter, wolfFont } = require("./lib/footer.cjs");

import { importSession } from "./session-importer.js";
import {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  downloadMediaMessage,
  extractMessageContent
} from "@whiskeysockets/baileys";
import makeWASocket from "@whiskeysockets/baileys";
import P from "pino";

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "BONY-XMD" }));
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 BONY-XMD health server listening on port ${PORT}`);
});

console.log("🚀 Starting BONY XMD...");

let authState;
let saveCreds;
let sock;
let reconnectTimer;
const processedMessageIds = new Set();
let socketGeneration = 0;
let connectionNotificationSent = false;
let centralReloading = false;

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

  const generation = ++socketGeneration;

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(
        authState.keys,
        P({ level: "silent" })
      )
    },
    logger: P({ level: "info" }),
    browser: Browsers.macOS("Safari"),
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  const currentSock = sock;

  const commandSock = new Proxy(sock, {
    get(target, prop) {
      if (prop === "sendMessage") {
        return async (jid, content, options) => {
          if (content?.edit) {
            return target.sendMessage(jid, content, options);
          }

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

  // 📵 BONY-XMD AntiCall
  sock.ev.on("call", async (calls) => {
    for (const call of calls) {
      if (call?.status !== "offer") continue;

      const settings = getAllSettings();

      if (!settings.antiCall) continue;

      try {
        await sock.rejectCall(call.id, call.from);

        console.log(
          `📵 AntiCall declined incoming call from ${call.from}`
        );

        const message =
          settings.antiCallMessage ||
          "🚫 Calls are not allowed. Please send a message instead.";

        await sock.sendMessage(call.from, {
          text: wolfFont(message)
        });

        console.log("📩 AntiCall message sent.");
      } catch (error) {
        console.error(
          "❌ AntiCall error:",
          error.message
        );
      }
    }
  });



  console.log("🧪 EVENT EMITTER TEST: socket created");

  sock.ev.on("connection.update", (data) => {
    console.log("🧪 RAW CONNECTION EVENT:", JSON.stringify(data));
  });

  sock.ev.on("creds.update", saveCreds);

  // 📱 Track WhatsApp LID → phone-number mappings
  sock.ev.on("chats.phoneNumberShare", ({ lid, jid }) => {
    if (!lid || !jid) return;

    const normalizedLid = String(lid).endsWith("@lid")
      ? String(lid)
      : `${lid}@lid`;

    const normalizedJid = String(jid).includes("@")
      ? String(jid)
      : `${jid}@s.whatsapp.net`;

    lidToPhoneMap.set(normalizedLid, normalizedJid);

    console.log(
      `📱 LID mapping: ${normalizedLid} → ${normalizedJid}`
    );
  });

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect }) => {
      if (generation !== socketGeneration || currentSock !== sock) {
        console.log("⚠️ Ignoring event from old BONY-XMD socket.");
        return;
      }

      console.log("Connection status:", connection);

      if (connection === "open") {
        centralReloading = false;
        const connectedNumber = sock.user.id.split(":")[0];
        console.log("🔎 ACTUAL CONNECTED ID:", sock.user?.id);
        console.log("╔══════════════════════════════════╗");
        console.log("║       BONY-XMD CONNECTED 🟢      ║");
        console.log(`║       Number: ${connectedNumber}       ║`);
        console.log("║       Online 🟢                  ║");
        console.log("╚══════════════════════════════════╝");
        if (getSetting("alwaysonline")) {
          try {
              await sock.sendPresenceUpdate("available");
              console.log("🟢 Always Online enabled.");

            } catch (error) {
              console.error("⚠️ Always Online error:", error.message);
            }
          }
        if (!connectionNotificationSent) {
          connectionNotificationSent = true;

        try {
          await sock.sendMessage(sock.user.id, {
            text: wolfFont(`╭─〔 ⚡ *BONY XMD* 〕─╮
│
│ 🟢 *𝗢𝗡𝗟𝗜𝗡𝗘*
│    Ready
│──────────
│ ⚙️ *𝗠𝗢𝗗𝗘*
│    PUBLIC
│──────────
│ ⌨️ *𝗣𝗥𝗘𝗙𝗜𝗫*
│    .
│──────────
│ 🔋 *STATUS*
│    ACTIVE
│
╰──────────────────╯
     Powered by BONY KE 🇱🇹`),
                                            });
          console.log("✅ Connection notification sent to connected number.");
          } catch (error) {
            console.error("⚠️ Failed to send connection notification:", error.message);
          }
        }
        try {
          await sock.newsletterFollow("120363430014003120@newsletter");
          console.log("📣 BONY XMD Channel followed successfully.");
        } catch (error) {
          if (error.message?.includes("unexpected response structure")) {
            try {
              const channel = await sock.newsletterMetadata(
                "jid",
                "120363430014003120@newsletter"
              );

              if (channel?.state?.type === "ACTIVE") {
                console.log("📣 BONY XMD Channel followed successfully.");
              } else {
                console.error("⚠️ BONY XMD Channel follow could not be confirmed.");
              }
            } catch (verifyError) {
              console.error("⚠️ Failed to verify BONY XMD Channel follow:", verifyError.message);
            }
          } else {
            console.error("⚠️ Failed to follow BONY XMD Channel:", error.message);
          }
        }
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        console.log("❌ BONY XMD connection closed.");
          const disconnectedNumber = sock?.user?.id?.split(":")[0];

        if (shouldReconnect) {
            console.log("🔄 Reconnecting...");

          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }

          reconnectTimer = setTimeout(() => {
            if (generation !== socketGeneration) return;

            startBonyXmd().catch((error) => {
              console.error("❌ Reconnect error:");
              console.error(error);
            });
          }, 5000);
        } else {
            console.log("⚠️ Session logged out. Pair again.");

          try {
            await fs.promises.rm("./session", {
              recursive: true,
              force: true
            });
            console.log("🗑️ BONY XMD session deleted after logout.");
          } catch (error) {
            console.error(
              "❌ Failed to delete session:",
              error.message
            );
          }
        }
      }
    }
  );

  // 📱 LID → PHONE NUMBER MAPPING FOR ANTIDELETE
const lidToPhoneMap = new Map();

// 🗃️ MESSAGE CACHE FOR DELETE RECOVERY
const deletedMessageCache = new Map();
const MAX_CACHED_MESSAGES = 1500;

function cacheMessage(msg) {
  if (!msg?.message || !msg?.key?.id || !msg?.key?.remoteJid) return;

  const keys = [
    `${msg.key.remoteJid}:${msg.key.id}`,
    msg.key.senderPn
      ? `${msg.key.senderPn}:${msg.key.id}`
      : null,
    msg.key.participantPn
      ? `${msg.key.participantPn}:${msg.key.id}`
      : null,
    msg.key.senderLid
      ? `${msg.key.senderLid}:${msg.key.id}`
      : null,
    msg.key.participant
      ? `${msg.key.participant}:${msg.key.id}`
      : null
  ].filter(Boolean);

  for (const cacheKey of keys) {
    deletedMessageCache.set(cacheKey, {
      message: msg.message,
      key: msg.key,
      timestamp: Date.now()
    });
  }

  if (deletedMessageCache.size > MAX_CACHED_MESSAGES) {
    const oldestKey = deletedMessageCache.keys().next().value;
    if (oldestKey) deletedMessageCache.delete(oldestKey);
  }
}

function getCachedMessage(key) {
  if (!key?.id || !key?.remoteJid) return null;

  const keys = [
    `${key.remoteJid}:${key.id}`,
    key.senderPn
      ? `${key.senderPn}:${key.id}`
      : null,
    key.participantPn
      ? `${key.participantPn}:${key.id}`
      : null,
    key.senderLid
      ? `${key.senderLid}:${key.id}`
      : null,
    key.participant
      ? `${key.participant}:${key.id}`
      : null
  ].filter(Boolean);

  for (const cacheKey of keys) {
    const cached = deletedMessageCache.get(cacheKey);
    if (cached) return cached;
  }

  return null;
}

function getCleanPhone(value) {
  if (!value) return null;

  const raw = String(value);
  if (raw.endsWith("@lid")) return null;

  const digits = raw.replace(/[^0-9]/g, "");
  return digits || null;
}

function getSenderJid(key) {
  if (!key) return null;

  const candidates = [
    key.participantPn,
    key.senderPn,
    key.participant,
    key.senderLid
  ];

  for (const candidate of candidates) {
    const mappedJid = candidate
      ? lidToPhoneMap.get(
          String(candidate).endsWith("@lid")
            ? String(candidate)
            : `${candidate}@lid`
        )
      : null;

    if (mappedJid) return mappedJid;

    const number = getCleanPhone(candidate);
    if (number) return `${number}@s.whatsapp.net`;
  }

  return null;
}

function getDeletedByJid(update, deletedKey, cached) {
  const candidates = [
    update?.participantPn,
    update?.senderPn,
    update?.participant,
    deletedKey?.participantPn,
    deletedKey?.senderPn,
    deletedKey?.participant,
    cached?.key?.participantPn,
    cached?.key?.senderPn,
    cached?.key?.participant
  ];

  for (const candidate of candidates) {
    const mappedJid = candidate
      ? lidToPhoneMap.get(
          String(candidate).endsWith("@lid")
            ? String(candidate)
            : `${candidate}@lid`
        )
      : null;

    if (mappedJid) return mappedJid;

    const number = getCleanPhone(candidate);
    if (number) return `${number}@s.whatsapp.net`;
  }

  return getSenderJid(cached?.key) || getSenderJid(deletedKey);
}

function getDeletedByText(jid) {
  if (!jid) return null;

  const number = getCleanPhone(jid);
  if (!number) return null;

  return `Deleted by @${number}`;
}

function getMessageText(message) {
  if (!message) return null;

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    null
  );
}

// 🗑️ DELETED MESSAGE DETECTOR
sock.ev.on("messages.update", async (updates) => {
  console.log("🗑️ MESSAGE UPDATE RECEIVED:", JSON.stringify(updates));

  // 🔎 STATUS REACTION ACK DIAGNOSTIC
  for (const item of updates) {
    const update = item?.update;

    if (
      update?.status === 8 ||
      update?.messageStubParameters?.length
    ) {
      console.log(
        "🚨 MESSAGE ACK/STATUS ERROR:",
        JSON.stringify({
          id: item?.key?.id,
          remoteJid: item?.key?.remoteJid,
          fromMe: item?.key?.fromMe,
          status: update?.status,
          messageStubParameters: update?.messageStubParameters
        })
      );
    }
  }

  const deleteSettings = getAllSettings();
  if (!deleteSettings.antiDelete) return;

  for (const item of updates) {
    const update = item?.update;
    const isRevoke = update?.messageStubType === 1;

    if (!isRevoke) continue;

    const deletedKey = item?.key || update?.key;

    if (!deletedKey?.id || !deletedKey?.remoteJid) continue;

    const cached =
      getCachedMessage(deletedKey) ||
      getCachedMessage(update?.key);

    const inbox = sock.user?.id;
    if (!inbox || !cached?.message) continue;

    const mediaMessage = extractMessageContent(cached.message);
    const deletedByJid = getDeletedByJid(
      update,
      deletedKey,
      cached
    );
    const deletedByText = getDeletedByText(deletedByJid);

    const senderJid = getSenderJid(cached?.key);
    const senderText = senderJid ? `@${getCleanPhone(senderJid)}` : "Unknown";
    const actualDeletedByJid = deletedKey?.fromMe && sock.user?.id ? sock.user.id : deletedByJid;
    const actualDeletedByText = actualDeletedByJid ? `@${getCleanPhone(actualDeletedByJid)}` : "Unknown";
    const mentions = [senderJid, actualDeletedByJid].filter(Boolean);
    const isGroup = deletedKey.remoteJid?.endsWith("@g.us");
    const isStatus = deletedKey.remoteJid === "status@broadcast";
    const chatType = isStatus ? "📱 STATUS" : isGroup ? "👥 GROUP" : "👤 PRIVATE";
    let chatName = null;
    if (isGroup) { try { const metadata = await sock.groupMetadata(deletedKey.remoteJid); chatName = metadata?.subject || null; } catch {} }
    const notice = `╭─⌈ 🗑️ MESSAGE DELETED ⌋\\n│ ${chatType}\\n${chatName ? `│ 📍 ${chatName}\\n` : ""}│ 👤 Message sender: ${senderText}\\n│ 🗑️ Deleted by: ${actualDeletedByText || "Unknown"}\\n╰──────────────\\n\\n✧ *Powered by* : BONY KE 🇱🇹`;

    try {
      const text = getMessageText(mediaMessage);

      // 📝 TEXT MESSAGE
      if (
        text &&
        !mediaMessage.imageMessage &&
        !mediaMessage.videoMessage &&
        !mediaMessage.audioMessage &&
        !mediaMessage.documentMessage &&
        !mediaMessage.stickerMessage
      ) {
        const body = `${notice}\n\n${text}`;

        await sock.sendMessage(inbox, {
          text: wolfFont(body),
          mentions
        });

        console.log("🗑️ Deleted text recovered to BONY inbox.");
      }

      // 🖼️ IMAGE
      else if (mediaMessage.imageMessage) {
        const buffer = await downloadMediaMessage(
          cached,
          "buffer",
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );

        const caption =
          `${notice}${
            mediaMessage.imageMessage.caption
              ? `\n\n${mediaMessage.imageMessage.caption}`
              : ""
          }`;

        await sock.sendMessage(inbox, {
          image: buffer,
          caption: wolfFont(caption),
          mentions
        });

        console.log("🗑️ Deleted image recovered to BONY inbox.");
      }

      // 🎥 VIDEO
      else if (mediaMessage.videoMessage) {
        const buffer = await downloadMediaMessage(
          cached,
          "buffer",
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );

        const caption =
          `${notice}${
            mediaMessage.videoMessage.caption
              ? `\n\n${mediaMessage.videoMessage.caption}`
              : ""
          }`;

        await sock.sendMessage(inbox, {
          video: buffer,
          caption: wolfFont(caption),
          mentions
        });

        console.log("🗑️ Deleted video recovered to BONY inbox.");
      }

      // 🎵 AUDIO
      else if (mediaMessage.audioMessage) {
        const buffer = await downloadMediaMessage(
          cached,
          "buffer",
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );

        await sock.sendMessage(inbox, {
          text: wolfFont(notice),
          mentions
        });

        await sock.sendMessage(inbox, {
          audio: buffer,
          mimetype:
            mediaMessage.audioMessage.mimetype ||
            "audio/mp4",
          ptt:
            mediaMessage.audioMessage.ptt ||
            false
        });

        console.log("🗑️ Deleted audio recovered to BONY inbox.");
      }

      // 📄 DOCUMENT
      else if (mediaMessage.documentMessage) {
        const buffer = await downloadMediaMessage(
          cached,
          "buffer",
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );

        const caption =
          `${notice}${
            mediaMessage.documentMessage.caption
              ? `\n\n${mediaMessage.documentMessage.caption}`
              : ""
          }`;

        await sock.sendMessage(inbox, {
          document: buffer,
          mimetype:
            mediaMessage.documentMessage.mimetype ||
            "application/octet-stream",
          fileName:
            mediaMessage.documentMessage.fileName ||
            "deleted-file",
          caption: wolfFont(caption),
          mentions
        });

        console.log("🗑️ Deleted document recovered to BONY inbox.");
      }

      // 🏷️ STICKER
      else if (mediaMessage.stickerMessage) {
        const buffer = await downloadMediaMessage(
          cached,
          "buffer",
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );

        await sock.sendMessage(inbox, {
          text: wolfFont(notice),
          mentions
        });

        await sock.sendMessage(inbox, {
          sticker: buffer
        });

        console.log("🗑️ Deleted sticker recovered to BONY inbox.");
      }

      // 📦 OTHER CONTENT
      else {
        const body = notice;

        await sock.sendMessage(inbox, {
          text: wolfFont(body),
          mentions
        });

        console.log("🗑️ Deleted content recovered to BONY inbox.");
      }
    } catch (error) {
      console.error(
        "❌ Delete recovery error:",
        error.message
      );
    }

    deletedMessageCache.delete(
      `${deletedKey.remoteJid}:${deletedKey.id}`
    );
  }
});

sock.ev.on(
    "messages.upsert",
    async ({ messages, type }) => {



      const currentSettings = getAllSettings();

      for (const msg of messages) {
        if (!msg.message) continue;

        const messageId = msg.key?.id;
        if (messageId) {
          if (processedMessageIds.has(messageId)) {
            console.log(`⏭️ Skipping duplicate message: ${messageId}`);
            continue;
          }

          processedMessageIds.add(messageId);
        if (currentSettings.autotyping) {
          sock.sendPresenceUpdate(
            "composing",
            msg.key.remoteJid
          ).catch((error) => {
            console.error("⚠️ Autotyping error:", error.message);
          });
        }

        if (currentSettings.autorecording) {
          sock.sendPresenceUpdate(
            "recording",
            msg.key.remoteJid
          ).catch((error) => {
            console.error("⚠️ Autorecording error:", error.message);
          });
        }




          if (processedMessageIds.size > 5000) {
            const oldestId = processedMessageIds.values().next().value;
            if (oldestId) processedMessageIds.delete(oldestId);
          }
        }

        // 🗃️ Save message so deleted content can be recovered
        console.log("🧪 ANTIDELETE KEY:", JSON.stringify({ remoteJid: msg.key?.remoteJid, id: msg.key?.id, participant: msg.key?.participant, participantPn: msg.key?.participantPn, participantLid: msg.key?.participantLid, senderPn: msg.key?.senderPn, senderLid: msg.key?.senderLid, fromMe: msg.key?.fromMe }));
        cacheMessage(msg);

        // 🗃️ STATUS HANDLER
        if (msg.key?.remoteJid === "status@broadcast") {
          try {
            await handleStatus(sock, msg);
          } catch (error) {
            console.error("❌ Status processing error:", error.message);
          }
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

        if (
          currentSettings.autoreact &&
          !msg.key.fromMe &&
          msg.key.remoteJid !== "status@broadcast"
        ) {
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

        // PRIVATE MODE: only owner/fromMe can use bot commands
        if (
          currentSettings.mode === "private" &&
          !msg.key.fromMe &&
          msg.key.remoteJid !== `${String(currentSettings.ownerNumber || "").replace(/[^0-9]/g, "")}@s.whatsapp.net`
        ) {
          continue;
        }

        const trimmed = text.trim();

        const currentPrefix = currentSettings.prefix || ".";

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

          await commandSock.sendMessage(
          msg.key.remoteJid,
          {
            react: {
              text: "👻",
              key: msg.key
            }
          }
        );

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
