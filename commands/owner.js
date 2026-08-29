export default async (sock, m, {from, config})=>{
  await sock.sendMessage(from, {text: `*👑 OWNER: ${config.ownerName}*\n📱 ${config.ownerNumber[0]}\n🤖 ${config.botName}\n🔗 ${config.pairSite}`}, {quoted: m});
}
