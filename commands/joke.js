module.exports = async (sock, msg) => {
  const jokes = [
    "😂 Why did the computer go to the doctor? Because it had a virus!",
    "🤣 Why was the math book sad? Because it had too many problems!",
    "😜 Why don't programmers like nature? It has too many bugs!",
    "😂 What do you call a fake noodle? An impasta! 🍝",
    "🤣 Why did the phone wear glasses? Because it lost its contacts! 📱",
    "😆 What did one wall say to the other wall? I'll meet you at the corner!",
    "😂 Why was the phone cold? Because it left its Windows open!",
    "🤣 What do you call a sleeping bull? A bulldozer! 🐂",
    "😜 Why did the developer go broke? Because he used up all his cache! 💸",
    "😂 What did the ocean say to the beach? Nothing, it just waved! 🌊"
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];

  await sock.sendMessage(msg.key.remoteJid, {
    text: `😜 *BONY XMD JOKE* 😂\n\n${joke}`
  }, { quoted: msg });
};
