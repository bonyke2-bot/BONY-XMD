const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database.json");

function loadDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return {};
  }
}

function saveDatabase(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = async (sock, m, args) => {
  const from = m.key.remoteJid;
  const isGroup = from.endsWith("@g.us");

  if (!isGroup) {
    return await sock.sendMessage(
      from,
      {
        text: "❌ *Antilink can only be configured inside a group.*"
      },
      { quoted: m }
    );
  }

  const settings = require("../settings.cjs");

  const sender = m.key.participant || from;
  const senderNumber = sender.replace(/[^0-9]/g, "");
  const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, "");

  const isOwner =
    m.key.fromMe || senderNumber === ownerNumber;

  if (!isOwner) {
    return await sock.sendMessage(
      from,
      {
        text: "❌ *Only the BONY-XMD owner can change antilink settings.*"
      },
      { quoted: m }
    );
  }

  const action = args[0]?.toLowerCase();

  if (!["on", "off", "kick"].includes(action)) {
    return await sock.sendMessage(
      from,
      {
        text:
          "🛡️ *BONY-XMD ANTILINK*\n\n" +
          "Usage:\n" +
          "!antilink on\n" +
          "!antilink kick\n" +
          "!antilink off"
      },
      { quoted: m }
    );
  }

  const db = loadDatabase();

  if (!Array.isArray(db.antilink)) {
    db.antilink = [];
  }

  if (!db.antilinkMode) {
    db.antilinkMode = {};
  }

  if (action === "off") {
    db.antilink = db.antilink.filter(id => id !== from);
    delete db.antilinkMode[from];

    saveDatabase(db);

    return await sock.sendMessage(
      from,
      {
        text:
          "╭━━━〔 *ANTILINK* 〕━━━╮\n" +
          "┃ 🛡️ Status: *OFF* ❌\n" +
          "┃ 🤖 BONY-XMD\n" +
          "╰━━━━━━━━━━━━━━━━━━╯"
      },
      { quoted: m }
    );
  }

  if (!db.antilink.includes(from)) {
    db.antilink.push(from);
  }

  db.antilinkMode[from] =
    action === "kick" ? "kick" : "warn";

  saveDatabase(db);

  const mode =
    action === "kick"
      ? "Instant Kick"
      : "Warn (3 Warnings = Kick)";

  await sock.sendMessage(
    from,
    {
      text:
        "╭━━━〔 *ANTILINK* 〕━━━╮\n" +
        "┃ 🛡️ Status: *ON* ✅\n" +
        `┃ ⚡ Mode: *${mode}*\n` +
        "┃ 🤖 BONY-XMD\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
    },
    { quoted: m }
  );
};
