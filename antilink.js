import fs from "fs";
export default async (sock, m, {from, args})=>{
  if(!from.endsWith("@g.us")) return sock.sendMessage(from, {text: "Group only!"}, {quoted: m});
  let db = JSON.parse(fs.readFileSync("./settings.json"));
  if(args[0]==="on"){ db.antilink[from]=true; fs.writeFileSync("./settings.json", JSON.stringify(db));
    await sock.sendMessage(from, {text: "*✅ Antilink ON*\nBot will delete links!"}, {quoted: m});
  }else if(args[0]==="off"){ db.antilink[from]=false; fs.writeFileSync("./settings.json", JSON.stringify(db));
    await sock.sendMessage(from, {text: "*❌ Antilink OFF*"}, {quoted: m});
  }else{ await sock.sendMessage(from, {text: `*Usage:.antilink on/off*`}, {quoted: m}); }
}
