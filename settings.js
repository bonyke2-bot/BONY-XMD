export default async (sock, m, {from, args, config})=>{
  const isGroup = from.endsWith("@g.us");
  if(!isGroup) return sock.sendMessage(from, {text: "*⚙️ Settings only for groups!*"}, {quoted: m});

  let menu = `*⚙️ BONY XMD SETTINGS*\n\n`;
  menu += `╭─「 GROUP SETTINGS 」\n`;
  menu += `│• .antilink on/off\n`;
  menu += `│• .welcome on/off\n`;
  menu += `│• .goodbye on/off\n`;
  menu += `│• .antilink action: kick/warn\n`;
  menu += `╰─\n\n`;
  menu += `╭─「 BOT SETTINGS 」\n`;
  menu += `│• .autostatus on/off\n`;
  menu += `│• .autoread on/off\n`;
  menu += `│• .autolike on/off\n`;
  menu += `│• .prefix .\n`;
  menu += `│• .mode public/private\n`;
  menu += `╰─\n\n`;
  menu += `*Use: .settings antilink on*\n*Pair: ${config.pairSite}*`;

  if(!args[0]){
    return await sock.sendMessage(from, {text: menu}, {quoted: m});
  }

  // Example handling
  const feature = args[0].toLowerCase();
  const action = args[1]?.toLowerCase();

  await sock.sendMessage(from, {text: `*⚙️ SETTINGS*\n\n✅ ${feature} has been turned ${action || 'updated'}!\n\n*BONY XMD Robot Active*`}, {quoted: m});
}
