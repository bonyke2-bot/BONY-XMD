export default async (sock, m, {from, config})=>{
  let menu = `*🤖 BONY XMD MENU*\n\n`;
  menu+= `• .ping\n• .alive\n• .owner\n• .pair\n• .bony\n`;
  menu+= `\nPair: ${config.pairSite}\nBy ${config.ownerName}`;
  await sock.sendMessage(from, {text: menu}, {quoted: m});
}
