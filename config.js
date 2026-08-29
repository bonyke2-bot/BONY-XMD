require("dotenv").config();

const config = {
  botName: process.env.BOT_NAME || "BONY-XMD",
  ownerNumber: process.env.OWNER_NUMBER || "",
  prefix: process.env.PREFIX || "."
};

module.exports = config;
