const CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8coEnKAwEcRBDDnq0Z";

const FONT_UPPER = [..."𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉"];
const FONT_LOWER = [..."𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣"];
const FONT_DIGITS = [..."𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿"];

function wolfFont(text) {
  return [...text].map(char => {
    const upper = char.toUpperCase();
    if (char >= "A" && char <= "Z") return FONT_UPPER[char.charCodeAt(0) - 65];
    if (char >= "a" && char <= "z") return FONT_LOWER[char.charCodeAt(0) - 97];
    if (char >= "0" && char <= "9") return FONT_DIGITS[char.charCodeAt(0) - 48];
    return char;
  }).join("");
}

async function sendWithFooter(sock, jid, text, options = {}) {
  return sock.sendMessage(
    jid,
    {
      text: `${wolfFont(text)}\n\n╭─⌈ \`BONY XMD\` ⌋\n│\n│ ✧ *Powered by* : BONY KE 🇱🇹\n╰────────────`
    },
    options
  );
}

module.exports = {
  CHANNEL_URL,
  sendWithFooter,
  wolfFont
};
