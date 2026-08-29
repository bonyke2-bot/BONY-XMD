export default async (sock, m, {from})=>{
  const start = Date.now();
  await sock.sendMessage(from, {text: "🏓 Ping..."}, {quoted: m});
  await sock.sendMessage(from, {text: `⚡ *BONY XMD Speed: ${Date.now()-start}ms*\n🤖 Robot Mode: Active`}, {quoted: m});
}
