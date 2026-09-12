const CONTROL_URL = process.env.BONY_CONTROL_URL || "http://127.0.0.1:3000";

async function reportBotStatus({ number, status }) {
  try {
    const response = await fetch(`${CONTROL_URL}/api/bots/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BONY_CONTROL_API_KEY
      },
      body: JSON.stringify({
        number,
        status,
        botName: "BONY-XMD",
        updatedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log(`📡 BONY-CONTROL: ${number} → ${status}`);
    return true;
  } catch (error) {
    console.error("⚠️ BONY-CONTROL status error:", error.message);
    return false;
  }
}

module.exports = {
  reportBotStatus
};
