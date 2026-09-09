module.exports = async (sock, msg, args) => {
  const jid = msg.key.remoteJid;
  const expression = args.join(" ").trim();

  if (!expression) {
    return sock.sendMessage(jid, {
      text: "🧮 Usage: !calc 25 * 4 + 10"
    });
  }

  if (!/^[0-9+\-*/%().\s]+$/.test(expression)) {
    return sock.sendMessage(jid, {
      text: "❌ Only numbers and basic operators are allowed."
    });
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)();

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    await sock.sendMessage(jid, {
      text: `🧮 *CALCULATOR*\n\n➤ ${expression}\n➤ = *${result}*`
    });
  } catch (error) {
    console.error("❌ calc error:", error.message);

    await sock.sendMessage(jid, {
      text: "❌ Invalid calculation."
    });
  }
};
