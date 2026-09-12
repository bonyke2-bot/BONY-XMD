const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.BONY_CONTROL_API_KEY || "";

const DATABASE_FILE = path.join(__dirname, "control-database.json");
const botStatuses = new Map();

app.use(express.json());

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(DATABASE_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Failed to load control-database.json:", error.message);
    return {};
  }
}

function saveSettings(settings) {
  fs.writeFileSync(
    DATABASE_FILE,
    JSON.stringify(settings, null, 2) + "\n",
    "utf8"
  );
}

function authorized(req) {
  if (!API_KEY) return false;
  return req.headers["x-api-key"] === API_KEY;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "control-dashboard.html"));
});

app.get("/api/settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  res.json({
    success: true,
    settings: loadSettings()
  });
});

app.post("/api/settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const current = loadSettings();
  const updates = req.body || {};

  const allowedKeys = new Set(Object.keys(current));

  for (const [key, value] of Object.entries(updates)) {
    if (allowedKeys.has(key)) {
      current[key] = value;
    }
  }

  saveSettings(current);

  res.json({
    success: true,
    settings: current
  });
});

app.post("/api/bots/status", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const { number, status, botName, updatedAt } = req.body || {};

  if (!number || !status) {
    return res.status(400).json({
      success: false,
      error: "number and status are required"
    });
  }

  botStatuses.set(String(number), {
    number: String(number),
    status: String(status),
    botName: botName || "BONY-XMD",
    updatedAt: updatedAt || new Date().toISOString(),
    lastSeen: new Date().toISOString()
  });

  console.log("📡 BOT STATUS:", botStatuses.get(String(number)));

  res.json({
    success: true
  });
});

app.get("/api/bots/status", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  res.json({
    success: true,
    bots: Array.from(botStatuses.values())
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("🌐 BONY-CONTROL SERVER");
  console.log("=================================");
  console.log(`🚀 Listening on port ${PORT}`);
});
