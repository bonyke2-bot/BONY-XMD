const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

/*
 * BONY-XMD
 * Single canonical settings system.
 *
 * database.json = persistent values
 * lib/settings.cjs = settings manager
 */

const DEFAULT_SETTINGS = {
  // 👑 BOT IDENTITY
  botName: "BONY-XMD 👑",
  ownerName: "BONY KE",
  ownerNumber: "",
  version: "2.0.0",

  // ⚙️ GENERAL
  mode: "public",
  prefix: ".",
  language: "en",
  timezone: "Africa/Nairobi",

  // 🎨 STICKER / MEDIA
  packname: "Created by",
  author: "BONY-XMD 💜",

  // 🛡️ SECURITY
  antilink: false,
  antiSpam: true,
  antiDelete: false,
  antiDeleteMode: "pm",

  // 🤖 AUTOMATION
  autoreact: false,
  autoread: false,
  autotyping: false,
  autorecording: false,
  alwaysonline: false,

  // ❤️ REACTION
  reaction: "❤️",

  // 👥 GROUP MESSAGES
  welcome: true,
  goodbye: true,

  // 📱 STATUS
  statusEnabled: true,
  statusAutoView: true,
  statusAutoReact: true,
  statusReaction: "👻",
  statusAutoReply: false,
  statusDownload: false,

  // 🔌 API / DATABASE
  geminiApiKey: "",
  mongodbUrl: ""
};

function loadDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(
        dbPath,
        JSON.stringify(DEFAULT_SETTINGS, null, 2)
      );
    }

    const data = JSON.parse(
      fs.readFileSync(dbPath, "utf8")
    );

    return {
      ...DEFAULT_SETTINGS,
      ...data
    };
  } catch (error) {
    console.error("⚠️ Database error:", error.message);

    return {
      ...DEFAULT_SETTINGS
    };
  }
}

function getAllSettings() {
  const settings = loadDatabase();

  // Environment variable takes priority for owner number.
  if (process.env.OWNER_NUMBER) {
    settings.ownerNumber = process.env.OWNER_NUMBER;
  }

  return settings;
}

function getSetting(name) {
  return getAllSettings()[name];
}

function saveSettings(changes) {
  const current = getAllSettings();

  const updated = {
    ...current,
    ...changes
  };

  fs.writeFileSync(
    dbPath,
    JSON.stringify(updated, null, 2)
  );

  return updated;
}

module.exports = {
  DEFAULT_SETTINGS,
  getAllSettings,
  getSetting,
  saveSettings
};
