import express from "express";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from "pino";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
  <html>
  <head><title>BONY XMD PAIR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
  body{background:#0a0a0a;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial}
  .box{background:#1a1a1a;padding:30px;border-radius:20px;text-align:center;width:90%;max-width:400px;border:1px solid #333}
  input{width:80%;padding:12px;border-radius:10px;border:none;margin:10px}
  button{padding:12px 20px;background:#00ff88;color:black;border:none;border-radius:10px;font-weight:bold;cursor:pointer;width:85%}
  h1{color:#00ff88}
  </style></head>
  <body>
  <div class="box">
  <h1>BONY XMD</h1>
  <h3>Pair Site</h3>
  <input id="num" placeholder="2547XXXXXXXX" type="text"/>
  <br><button onclick="getCode()">GET PAIR CODE</button>
  <p id="result" style="margin-top:20px;font-size:22px;color:#00ff88;font-weight:bold"></p>
  <p style="font-size:12px;color:gray">Powered by BonyKE</p>
  </div>
  <script>
  async function getCode(){
    const num=document.getElementById('num').value;
    document.getElementById('result').innerText='Please wait...';
    const res=await fetch('/code?number='+num);
    const data=await res.json();
    document.getElementById('result').innerText=data.code || data.error;
  }
  </script>
  </body>
  </html>
  `);
});

app.get("/code", async (req, res) => {
  let num = req.query.number;
  if(!num) return res.json({error:"Enter number with country code"});
  num = num.replace(/[^0-9]/g,'');
  try {
    const { state } = await useMultiFileAuthState("./auth");
    const sock = makeWASocket({
      auth: state.creds,
      logger: pino({level:"silent"}),
      printQRInTerminal: false,
      browser: ["BONY XMD","Chrome","1.0"]
    });
    if(!sock.authState.creds.registered){
      await delay(1000);
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      res.json({code: code});
    }
  } catch(e){
    res.json({error: "Failed: "+e.message});
  }
});

app.listen(PORT, () => console.log("BONY XMD Pair Running on "+PORT));
