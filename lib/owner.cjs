const { getSetting } = require("./settings.cjs");

function isOwner(m) {
  const ownerNumber = String(getSetting("ownerNumber") || "")
    .replace(/[^0-9]/g, "");

  const sender = m?.key?.participant || m?.key?.remoteJid || "";
  const senderNumber = String(sender).split(":")[0].replace(/[^0-9]/g, "");

  return Boolean(ownerNumber) &&
    (Boolean(m?.key?.fromMe) || senderNumber === ownerNumber);
}

module.exports = { isOwner };
