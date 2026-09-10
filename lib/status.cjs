const isStatusMessage = (msg) => {
  return msg?.key?.remoteJid === "status@broadcast";
};

async function handleStatus(sock, msg) {
  // Ignore WhatsApp Status messages.
  // This prevents unnecessary status processing and PreKey errors.
  if (!isStatusMessage(msg)) return;

  return;
}

module.exports = {
  handleStatus,
  isStatusMessage,
};
