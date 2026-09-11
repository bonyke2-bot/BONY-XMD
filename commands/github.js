const { getSetting } = require("../lib/settings.cjs");

module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const username = text.trim().split(/\s+/)[1];

  if (!username) {
    return sock.sendMessage(jid, {
      text: "🐙 *BONY XMD GITHUB*\n\nUsage: `" + (getSetting("prefix") || ".") + "github <username>`\n\nExample:\n`" + (getSetting("prefix") || ".") + "github octocat`"
    }, { quoted: msg });
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "BONY-XMD"
        }
      }
    );

    if (!response.ok) {
      throw new Error("GitHub user not found");
    }

    const user = await response.json();

    const message =
`🐙 *BONY XMD GITHUB*

👤 Name: *${user.name || "Not provided"}*
🔖 Username: *@${user.login}*
🏢 Company: ${user.company || "None"}
📍 Location: ${user.location || "Not provided"}

📝 Bio:
${user.bio || "No bio"}

📦 Public repos: *${user.public_repos}*
👥 Followers: *${user.followers}*
👤 Following: *${user.following}*

🔗 Profile:
${user.html_url}`;

    await sock.sendMessage(jid, {
      text: message
    }, { quoted: msg });

  } catch (error) {
    console.error("GitHub error:", error.message);

    await sock.sendMessage(jid, {
      text: `❌ GitHub user *${username}* was not found.`
    }, { quoted: msg });
  }
};
