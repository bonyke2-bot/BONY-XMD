const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

const DEFAULT_SETTINGS = { ownerNumber: "",
    mode: "public",
    prefix: ".",
    antilink: false,
    autoreact: false,
    autoread: false,
    autotyping: false,
    autorecording: false,
    alwaysonline: false,
    welcome: true,
    goodbye: true,
    reaction: ["🙌","✋","🙆","⛷️","🧑‍🔧","🧑‍🤝‍🧑","🌷","🌼","🍃","🪹","🪺","🌈","🌦️","🐻‍❄️","🐨","🐀","🐁","🐰","🐭","🐏","🦍","🐅","🦏","🦛","🦦","🦔"],
    statusEnabled: true,
    statusAutoView: true,
    statusAutoReact: false,
    statusReaction: ["❤️","💝","💖","💯","😁"],
    statusAutoReply: false,
    statusDownload: false
};

function loadDatabase() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(
                dbPath,
                JSON.stringify(DEFAULT_SETTINGS, null, 2)
            );
        }

        return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } catch (error) {
        console.error("⚠️ Database error:", error.message);
        return { ...DEFAULT_SETTINGS };
    }
}

function getAllSettings() {
    const settings = {
        ...DEFAULT_SETTINGS,
        ...loadDatabase()
    };

    if (process.env.OWNER_NUMBER) {
        settings.ownerNumber = process.env.OWNER_NUMBER;
    }

    if (process.env.PREFIX) {
        settings.prefix = process.env.PREFIX;
    }

    return settings;
}

function getSetting(name) {
    return getAllSettings()[name];
}

function saveSettings(changes) {
    const current = getAllSettings();

    const updated = {
        ...current,
        ...changes
    };

    fs.writeFileSync(
        dbPath,
        JSON.stringify(updated, null, 2)
    );

    return updated;
}

module.exports = {
    DEFAULT_SETTINGS,
    getAllSettings,
    getSetting,
    saveSettings
};
