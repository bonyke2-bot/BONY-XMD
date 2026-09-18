const { getSetting } = require("../lib/settings.cjs");
const { wolfFont } = require("../lib/footer.cjs");
const fs = require("fs");
const path = require("path");

function getHost() {
  if (
    process.env.HEROKU_APP_NAME ||
    process.env.DYNO ||
    process.env.HEROKU_DYNO_ID
  ) {
    return "Heroku";
  }

  if (
    process.env.RENDER_SERVICE_NAME ||
    process.env.RENDER_INSTANCE_ID
  ) {
    return "Render";
  }

  if (
    process.env.KOYEB_APP_NAME ||
    process.env.KOYEB_INSTANCE_ID
  ) {
    return "Koyeb";
  }

  if (
    process.env.TERMUX_VERSION ||
    process.env.PREFIX?.includes("com.termux")
  ) {
    return "Termux";
  }

  return "Unknown";
}

module.exports = async (sock, m, args) => {
  try {
    const pushName =
      m.pushName ||
      m.senderPn ||
      (m.sender ? m.sender.split("@")[0] : "User");

    const chatId = m.key.remoteJid;
    const prefix = getSetting("prefix") || ".";

    function runtime(seconds) {
      seconds = Number(seconds);

      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const min = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);

      return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${min > 0 ? min + "m " : ""}${s}s`;
    }

    const uptime = runtime(process.uptime());

    let commandList = [];

    try {
      const commandsDir = path.join(__dirname, "../commands");

      if (fs.existsSync(commandsDir)) {
        commandList = fs.readdirSync(commandsDir)
          .filter(file => file.endsWith(".js"))
          .map(file => file.replace(".js", "").toLowerCase());
      }
    } catch (error) {
      console.error("Error reading commands folder:", error);
    }

    const totalCommands = commandList.length;

    const categories = {
      "BOT INFO": [
        "alive",
        "ping",
        "menu",
        "owner",
        "runtime",
        "repo",
        "github",
        "gstatut",
        "jid",
        "jidnewsletter",
        "help"
      ],

      "TOOLS": [
        "play",
        "igdl",
        "twitter",
        "fb",
        "video",
        "vv",
        "sticker",
        "tourl",
        "shorturl",
        "lyrics",
        "joke",
        "calc",
        "define",
        "weather",
        "time",
        "date",
        "qr",
        "contact",
        "whois",
        "getpp",
        "sex",
        "clear",
        "fakehack"
      ],

      "GROUP": [
        "add",
        "admins",
        "groupadmins",
        "groupannounce",
        "groupcreated",
        "groupdesc",
        "groupedit",
        "groupid",
        "groupinfo",
        "groupmembers",
        "groupmeta",
        "invite",
        "kick",
        "kickall",
        "link",
        "members",
        "promote",
        "demote",
        "open",
        "close",
        "revoke",
        "setdesc",
        "setname",
        "tagadmins",
        "tagall",
        "hidetag",
        "delete",
        "del"
      ],

      "SETTINGS": [
        "alwaysonline",
        "anticall",
        "antidelete",
        "antilink",
        "autoreact",
        "autoread",
        "autorecording",
        "autotyping",
        "autoviewstatus",
        "goodbye",
        "mode",
        "setprefix",
        "settings",
        "getallsettings"
      ]
    };

    const categorizedCommands = new Set(
      Object.values(categories).flat()
    );

    const otherCommands = commandList.filter(
      cmd => !categorizedCommands.has(cmd)
    );

    if (otherCommands.length > 0) {
      categories["OTHER"] = otherCommands;
    }

    let menuCategoriesText = "";

    for (const [categoryName, commands] of Object.entries(categories)) {
      const activeCommands = commands.filter(
        cmd => commandList.includes(cmd)
      );

      if (activeCommands.length === 0) continue;

      const rows = [];

      for (let i = 0; i < activeCommands.length; i += 3) {
        const row = activeCommands
          .slice(i, i + 3)
          .map(cmd => `${prefix}${cmd}`)
          .join(" • ");

        rows.push(`┋ ⬡ ${row}`);
      }

      menuCategoriesText +=
        `\n『 ${categoryName} 』\n` +
        `╭────────────────────\n` +
        `${rows.join("\n")}\n` +
        `╰────────────────────\n`;
    }

    const menu =
      `╭───〔 BONY-XMD ULTRA 〕───\n` +
      `├ Owner: ${getSetting("ownerName") || "BONY KE"}\n` +
      `├ User: ${pushName}\n` +
      `├ Prefix: ${prefix}\n` +
      `├ Mode: ${getSetting("mode") || "public"}\n` +
      `├ Version: ${getSetting("version") || "2.0.0"}\n` +
      `├ Commands: ${totalCommands}\n` +
      `├ Runtime: ${uptime}\n` +
      `└ Host: ${getHost()}\n` +
      `${menuCategoriesText}\n` +
      `> Powered by BONY-XMD`;

    await sock.sendMessage(
      chatId,
      {
        image: {
          url: "https://files.catbox.moe/8rcgs3.jpg"
        },
        caption: wolfFont(menu)
      },
      {
        quoted: m
      }
    );
  } catch (error) {
    console.error("Menu Error:", error);

    await sock.sendMessage(
      m.key.remoteJid,
      {
        text: "❌ Menu failed to load. Check the Termux error."
      },
      {
        quoted: m
      }
    );
  }
};
