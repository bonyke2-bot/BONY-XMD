module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const city = text.trim().split(/\s+/).slice(1).join(" ");

  if (!city) {
    return sock.sendMessage(jid, {
      text: "🌤️ *BONY XMD WEATHER*\n\nUsage: `!weather <city>`\n\nExample: `!weather Kisii`"
    }, { quoted: msg });
  }

  try {
    await sock.sendMessage(jid, {
      text: `🌤️ Checking weather for *${city}*...`
    }, { quoted: msg });

    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather service unavailable");
    }

    const data = await response.json();
    const current = data.current_condition?.[0];

    if (!current) {
      throw new Error("Weather not found");
    }

    const area = data.nearest_area?.[0];
    const location =
      area?.areaName?.[0]?.value || city;

    const country =
      area?.country?.[0]?.value || "";

    const description =
      current.weatherDesc?.[0]?.value || "Unknown";

    const message =
`🌤️ *BONY XMD WEATHER*

📍 Location: *${location}*
🌍 Country: *${country}*

🌡️ Temperature: *${current.temp_C}°C*
🤔 Feels like: *${current.FeelsLikeC}°C*
☁️ Condition: *${description}*
💧 Humidity: *${current.humidity}%*
💨 Wind: *${current.windspeedKmph} km/h*
👁️ Visibility: *${current.visibility} km*
📊 Pressure: *${current.pressure} mb*

🤖 *Powered by BONY XMD*`;

    await sock.sendMessage(jid, {
      text: message
    }, { quoted: msg });

  } catch (error) {
    console.error("Weather error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Couldn't find the weather for that location. Try another city, e.g. `!weather Nairobi`."
    }, { quoted: msg });
  }
};
