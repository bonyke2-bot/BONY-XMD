const { getSetting, saveSettings } = require("../lib/settings.cjs");

module.exports = async (sock, m, args) => {
  const chatId = m.key.remoteJid;

  const sender = m.key.participant || chatId;
  const senderNumber = sender.replace(/[^0-9]/g, "");
  const ownerNumber = String(getSetting("ownerNumber") || "").replace(/[^0-9]/g, "");
  const isOwner = m.key.fromMe || senderNumber === ownerNumber;

  if (!isOwner) {
    return await sock.sendMessage(chatId, {
      text: "❌ *Only the BONY-XMD owner can change AntiCall settings.*"
    }, { quoted: m });
  }

  const action = args[0]?.toLowerCase();

  if (!action) {
    return await sock.sendMessage(chatId, {
      text:
        "📵 *BONY-XMD ANTICALL*\n\n" +
        `Status: *${getSetting("antiCall") ? "ON" : "OFF"}*\n` +
        `Message: *${getSetting("antiCallMessage") || "Not set"}*\n\n` +
        "Usage:\n" +
        ".anticall on\n" +
        ".anticall off\n" +
        ".anticall msg <message>"
    }, { quoted: m });
  }

  if (action === "on" || action === "off") {
    const value = action === "on";

    saveSettings({ antiCall: value });

    return await sock.sendMessage(chatId, {
      text:
        `📵 *AntiCall:* ${value ? "ON ✅" : "OFF ❌"}\n\n` +
        (value
          ? "Incoming calls will be automatically declined."
          : "Calls are now allowed normally.")
    }, { quoted: m });
  }

  if (action === "msg") {
    const message = args.slice(1).join(" ").trim();

    if (!message) {
      return await sock.sendMessage(chatId, {
        text:
          "❌ Please provide the AntiCall message.\n\n" +
          "Example:\n" +
          ".anticall msg Please text me instead of calling."
      }, { quoted: m });
    }

    saveSettings({ antiCallMessage: message });

    return await sock.sendMessage(chatId, {
      text:
        "✅ *AntiCall message updated!*\n\n" +
        `📩 ${message}`
    }, { quoted: m });
  }

  return await sock.sendMessage(chatId, {
    text:
      "❌ Invalid AntiCall option.\n\n" +
      "Use:\n" +
      ".anticall on\n" +
      ".anticall off\n" +
      ".anticall msg <message>"
  }, { quoted: m });
};
