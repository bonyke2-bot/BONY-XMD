const fs = require("fs");
const path = require("path");

const commands = new Map();

const commandsDir = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsDir)) {
  if (!file.endsWith(".js")) continue;

  try {
    const command = require(path.join(commandsDir, file));

    if (typeof command === "function") {
      const name = file.replace(".js", "").toLowerCase();
      commands.set(name, command);
    }
  } catch (error) {
    console.error(`⚠️ Could not load command ${file}:`, error.message);
  }
}

console.log(`📦 Loaded ${commands.size} BONY XMD commands.`);

module.exports = commands;
