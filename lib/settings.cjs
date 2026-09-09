const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

const DEFAULT_SETTINGS = {
    mode: "private",
    prefix: "!",
    antilink: false,
    autoreact: true,
    autoread: false,
    autotyping: true,
    autorecording: false,
    alwaysonline: false,
    welcome: true,
    goodbye: true,
    reaction: "❤️",
    statusEnabled: true,
    statusAutoView: true,
    statusAutoReact: false,
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
    return {
        ...DEFAULT_SETTINGS,
        ...loadDatabase()
    };
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
