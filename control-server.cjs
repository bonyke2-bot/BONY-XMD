const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.BONY_CONTROL_API_KEY || "";

const DATABASE_FILE = path.join(__dirname, "control-database.json");
const BOTS_FILE = path.join(__dirname, "control-bots.json");
const botStatuses = new Map();

function loadBotRegistry() {
  try {
    if (!fs.existsSync(BOTS_FILE)) {
      return {
        masterSettings: {},
        bots: {}
      };
    }

    const data = JSON.parse(fs.readFileSync(BOTS_FILE, "utf8"));

    return {
      masterSettings: data.masterSettings || {},
      bots: data.bots || {}
    };
  } catch (error) {
    console.error("❌ Failed to load control-bots.json:", error.message);
    return {
      masterSettings: {},
      bots: {}
    };
  }
}

function saveBotRegistry(registry) {
  fs.writeFileSync(
    BOTS_FILE,
    JSON.stringify(registry, null, 2) + "\n",
    "utf8"
  );
}

function applyMasterSettings(registry, updates, allowedKeys) {
  if (!registry.masterSettings) {
    registry.masterSettings = {};
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.has(key)) continue;

    registry.masterSettings[key] = value;

    for (const bot of Object.values(registry.bots || {})) {
      if (!bot.settings) bot.settings = {};
      if (!bot.customSettings) bot.customSettings = {};

      if (!bot.customSettings[key]) {
        bot.settings[key] = value;
        bot.updatedAt = new Date().toISOString();
      }
    }
  }
}

const CREDENTIALS_FILE = path.join(
  __dirname,
  "control-bot-credentials.json"
);

function loadBotCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return { bots: {} };
    }

    const data = JSON.parse(
      fs.readFileSync(CREDENTIALS_FILE, "utf8")
    );

    return {
      bots: data.bots || {}
    };
  } catch (error) {
    console.error(
      "❌ Failed to load bot credentials:",
      error.message
    );

    return {
      bots: {}
    };
  }
}

function saveBotCredentials(credentials) {
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(credentials, null, 2) + "\n",
    "utf8"
  );
}

function generateBotToken() {
  return require("crypto").randomBytes(32).toString("hex");
}

function getBotNumberFromToken(token) {
  if (!token) return null;

  const credentials = loadBotCredentials();

  for (const [number, savedToken] of Object.entries(credentials.bots)) {
    if (savedToken === token) {
      return number;
    }
  }

  return null;
}

function createBotToken(number) {
  const normalizedNumber = String(number);
  const credentials = loadBotCredentials();

  if (credentials.bots[normalizedNumber]) {
    return credentials.bots[normalizedNumber];
  }

  const token = generateBotToken();

  credentials.bots[normalizedNumber] = token;
  saveBotCredentials(credentials);

  return token;
}

function getBotToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function authorizedBot(req) {
  const token = getBotToken(req);
  const number = getBotNumberFromToken(token);

  if (!number) {
    return null;
  }

  return number;
}

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
  const registry = loadBotRegistry();
  applyMasterSettings(registry, updates, allowedKeys);
  saveBotRegistry(registry);

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

app.post("/api/bot/status", (req, res) => {
  const botNumber = authorizedBot(req);

  if (!botNumber) {
    return res.status(401).json({
      success: false,
      error: "Invalid bot token"
    });
  }

  const { number, status, botName, updatedAt } = req.body || {};
  const normalizedNumber = String(number || "").trim();

  if (!normalizedNumber || !status) {
    return res.status(400).json({
      success: false,
      error: "number and status are required"
    });
  }

  if (normalizedNumber !== botNumber) {
    return res.status(403).json({
      success: false,
      error: "Bot token does not match number"
    });
  }

  botStatuses.set(normalizedNumber, {
    number: normalizedNumber,
    status: String(status),
    botName: botName || "BONY-XMD",
    updatedAt: updatedAt || new Date().toISOString(),
    lastSeen: new Date().toISOString()
  });

  console.log("📡 BOT STATUS (TOKEN):", botStatuses.get(normalizedNumber));

  res.json({
    success: true
  });
});

app.get("/api/master-settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const registry = loadBotRegistry();

  res.json({
    success: true,
    settings: registry.masterSettings
  });
});

app.post("/api/master-settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const registry = loadBotRegistry();
  const current = loadSettings();
  const updates = req.body || {};
  const allowedKeys = new Set(Object.keys(current));

  applyMasterSettings(registry, updates, allowedKeys);

  saveBotRegistry(registry);

  res.json({
    success: true,
    settings: registry.masterSettings
  });
});

app.get("/api/bots", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const registry = loadBotRegistry();

  res.json({
    success: true,
    bots: Object.values(registry.bots)
  });
});

app.post("/api/bots/register", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const { number, botName } = req.body || {};

  if (!number) {
    return res.status(400).json({
      success: false,
      error: "number is required"
    });
  }

  const normalizedNumber = String(number);
  const registry = loadBotRegistry();

  if (registry.bots[normalizedNumber]) {
    return res.json({
      success: true,
      created: false,
      bot: registry.bots[normalizedNumber]
    });
  }

  registry.bots[normalizedNumber] = {
    number: normalizedNumber,
    botName: botName || "BONY-XMD",
    status: "offline",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      ...registry.masterSettings
    }
  };

  saveBotRegistry(registry);

  console.log("👤 BOT REGISTERED:", normalizedNumber);

  res.json({
    success: true,
    created: true,
    bot: registry.bots[normalizedNumber]
  });
});

app.post("/api/bots/:number/token", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const number = String(req.params.number);
  const registry = loadBotRegistry();

  if (!registry.bots[number]) {
    return res.status(404).json({
      success: false,
      error: "Bot not found"
    });
  }

  const token = createBotToken(number);

  console.log("🔐 BOT TOKEN CREATED:", number);

  res.json({
    success: true,
    number,
    token
  });
});

app.post("/api/bot/connect", (req, res) => {
  const botNumber = authorizedBot(req);

  if (!botNumber) {
    return res.status(401).json({
      success: false,
      error: "Invalid bot token"
    });
  }

  const { number, botName } = req.body || {};
  const normalizedNumber = String(number || "").trim();

  if (!normalizedNumber) {
    return res.status(400).json({
      success: false,
      error: "number is required"
    });
  }

  if (normalizedNumber !== botNumber) {
    return res.status(403).json({
      success: false,
      error: "Bot token does not match number"
    });
  }

  const registry = loadBotRegistry();
  const now = new Date().toISOString();

  if (!registry.bots[normalizedNumber]) {
    registry.bots[normalizedNumber] = {
      number: normalizedNumber,
      botName: botName || "BONY-XMD",
      status: "online",
      createdAt: now,
      updatedAt: now,
      settings: {
        ...registry.masterSettings
      },
      customSettings: {}
    };

    console.log("👤 BOT AUTO-REGISTERED:", normalizedNumber);
  } else {
    registry.bots[normalizedNumber].status = "online";
    registry.bots[normalizedNumber].updatedAt = now;

    if (botName) {
      registry.bots[normalizedNumber].botName = botName;
    }

    console.log("🟢 BOT CONNECTED:", normalizedNumber);
  }

  saveBotRegistry(registry);

  res.json({
    success: true,
    number: normalizedNumber,
    botName: registry.bots[normalizedNumber].botName
  });
});

app.get("/api/bots/:number/settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const botNumber = String(req.params.number);
  const registry = loadBotRegistry();
  const bot = registry.bots[botNumber];

  if (!bot) {
    return res.status(404).json({
      success: false,
      error: "Bot not registered"
    });
  }

  const settings = {
    ...bot.settings
  };

  delete settings.geminiApiKey;
  delete settings.mongodbUrl;

  res.json({
    success: true,
    number: botNumber,
    updatedAt: bot.updatedAt,
    settings
  });
});

app.get("/api/bot/settings", (req, res) => {
  const botNumber = authorizedBot(req);

  if (!botNumber) {
    return res.status(401).json({
      success: false,
      error: "Invalid bot token"
    });
  }

  const registry = loadBotRegistry();
  const bot = registry.bots[botNumber];

  if (!bot) {
    return res.status(404).json({
      success: false,
      error: "Bot not registered"
    });
  }

  const settings = {
    ...bot.settings
  };

  delete settings.geminiApiKey;
  delete settings.mongodbUrl;

  res.json({
    success: true,
    number: botNumber,
    updatedAt: bot.updatedAt,
    settings
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

  app.get("/api/bots/:number", (req, res) => {
    if (!authorized(req)) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const number = String(req.params.number);
    const registry = loadBotRegistry();
    const bot = registry.bots[number];

    if (!bot) {
      return res.status(404).json({
        success: false,
        error: "Bot not found"
      });
    }

    res.json({
      success: true,
      bot
    });
  });

app.post("/api/bots/:number/settings", (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const number = String(req.params.number);
  const registry = loadBotRegistry();

  if (!registry.bots[number]) {
    return res.status(404).json({
      success: false,
      error: "Bot not found"
    });
  }

  const current = loadSettings();
  const updates = req.body || {};
  const allowedKeys = new Set(Object.keys(current));

  if (!registry.bots[number].settings) {
    registry.bots[number].settings = {};
  }

  for (const [key, value] of Object.entries(updates)) {
    if (allowedKeys.has(key)) {
      registry.bots[number].settings[key] = value;

      if (!registry.bots[number].customSettings) {
        registry.bots[number].customSettings = {};
      }

      if (value === registry.masterSettings[key]) {
        delete registry.bots[number].customSettings[key];
      } else {
        registry.bots[number].customSettings[key] = true;
      }
    }
  }

  registry.bots[number].updatedAt = new Date().toISOString();

  saveBotRegistry(registry);

  res.json({
    success: true,
    bot: registry.bots[number]
  });
});


app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("🌐 BONY-CONTROL SERVER");
  console.log("=================================");
  console.log(`🚀 Listening on port ${PORT}`);
});
