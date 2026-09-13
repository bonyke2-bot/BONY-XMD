const { getCentralSettings, getBotSettings } = require("./control-settings.cjs");
const { getAllSettings, saveSettings } = require("./settings.cjs");

async function syncCentralSettings() {
  const central = await getCentralSettings();

  if (!central) {
    console.log("⚠️ BONY-CONTROL unavailable. Keeping local settings.");
    return { success: false, changed: false, changes: {} };
  }

  const local = getAllSettings();

  const mapping = {
    botName: "botName",
    ownerName: "ownerName",
    ownerNumber: "ownerNumber",
    version: "version",
    mode: "mode",
    prefix: "prefix",
    language: "language",
    timezone: "timezone",
    packname: "packname",
    author: "author",

    antilink: "antilink",
    antiSpam: "antiSpam",
    antiDelete: "antiDelete",
    antiDeleteMode: "antiDeleteMode",

    autoreact: "autoreact",
    autoread: "autoread",
    autotyping: "autotyping",
    autorecording: "autorecording",
    alwaysonline: "alwaysonline",

    reaction: "reaction",

    welcome: "welcome",
    goodbye: "goodbye",

    statusEnabled: "statusEnabled",
    statusAutoView: "statusAutoView",
    statusAutoReact: "statusAutoReact",
    statusReaction: "statusReaction",
    statusAutoReply: "statusAutoReply",
    statusDownload: "statusDownload",

    geminiApiKey: "geminiApiKey",
    mongodbUrl: "mongodbUrl"
  };

  const changes = {};

  for (const [centralKey, localKey] of Object.entries(mapping)) {
    if (
      central[centralKey] !== undefined &&
      central[centralKey] !== local[localKey]
    ) {
      changes[localKey] = central[centralKey];
    }
  }

  if (Object.keys(changes).length === 0) {
    return {
      success: true,
      changed: false,
      changes: {}
    };
  }

  saveSettings(changes);

  console.log(
    "🌐 BONY-CONTROL settings changed:",
    Object.keys(changes).join(", ")
  );

  return {
    success: true,
    changed: true,
    changes
  };
}

async function syncBotSettings(number) {
  const central = await getBotSettings(number);
  if (!central) {
    console.log("⚠️ BONY-CONTROL bot settings unavailable. Keeping local settings.");
    return { success: false, changed: false, changes: {} };
  }
  const local = getAllSettings();
  const mapping = {
    botName: "botName", ownerName: "ownerName", ownerNumber: "ownerNumber", version: "version", mode: "mode", prefix: "prefix", language: "language", timezone: "timezone", packname: "packname", author: "author",
    antilink: "antilink", antiSpam: "antiSpam", antiDelete: "antiDelete", antiDeleteMode: "antiDeleteMode", autoreact: "autoreact", autoread: "autoread", autotyping: "autotyping", autorecording: "autorecording", alwaysonline: "alwaysonline", reaction: "reaction", welcome: "welcome", goodbye: "goodbye", statusEnabled: "statusEnabled", statusAutoView: "statusAutoView", statusAutoReact: "statusAutoReact", statusReaction: "statusReaction", statusAutoReply: "statusAutoReply", statusDownload: "statusDownload"
  };
  const changes = {};
  for (const [centralKey, localKey] of Object.entries(mapping)) {
    if (central[centralKey] !== undefined && central[centralKey] !== local[localKey]) changes[localKey] = central[centralKey];
  }
  if (Object.keys(changes).length === 0) return { success: true, changed: false, changes: {} };
  saveSettings(changes);
  console.log("🤖 BONY-CONTROL bot settings changed:", Object.keys(changes).join(", "));
  return { success: true, changed: true, changes };
}

module.exports = {
  syncCentralSettings,
  syncBotSettings
};
