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

async function connectBot({ number }) {
  if (!number) {
    console.error("⚠️ BONY-XMD bot number is not available.");
    return null;
  }

  try {
    const response = await fetch(`${CONTROL_URL}/api/bots/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BONY_CONTROL_API_KEY
      },
      body: JSON.stringify({
        number,
        botName: "BONY-XMD"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("Bot registration rejected");
    }

    console.log(`🔐 BONY-CONTROL bot registered: ${number}`);
    return data;
  } catch (error) {
    console.error(
      "⚠️ BONY-CONTROL bot registration error:",
      error.message
    );
    return null;
  }
}

module.exports = {
  reportBotStatus,
  connectBot
};
