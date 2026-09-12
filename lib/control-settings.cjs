const CONTROL_URL =
  process.env.BONY_CONTROL_URL || "http://127.0.0.1:3000";

async function getCentralSettings() {
  try {
    const response = await fetch(`${CONTROL_URL}/api/settings`, {
      headers: {
        "x-api-key": process.env.BONY_CONTROL_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.settings) {
      throw new Error("Invalid settings response");
    }

    return data.settings;
  } catch (error) {
    console.error(
      "⚠️ BONY-CONTROL settings error:",
      error.message
    );

    return null;
  }
}

module.exports = {
  getCentralSettings
};
