import express from "express";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { fileURLToPath } from "url";
import makeWASocket, {
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";
import P from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const sessionsDir = path.join(__dirname, "sessions");

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/pair", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

async function buildSessionString(sessionPath) {
  const files = {};

  async function readDirectory(currentDir, relativeDir = "") {
    const entries = await fs.promises.readdir(currentDir, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      const relativePath = relativeDir
        ? path.join(relativeDir, entry.name)
        : entry.name;

      if (entry.isDirectory()) {
        await readDirectory(fullPath, relativePath);
      } else {
        const data = await fs.promises.readFile(fullPath);
        files[relativePath] = data.toString("base64");
      }
    }
  }

  await readDirectory(sessionPath);

  const payload = {
    version: 1,
    files
  };

  const compressed = zlib.gzipSync(
    Buffer.from(JSON.stringify(payload))
  );

  return `BONYXMD~${compressed.toString("base64url")}`;
}

app.post("/api/pair", async (req, res) => {
  let sock;

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp phone number is required."
      });
    }

    const cleanNumber = String(phoneNumber).replace(/\D/g, "");

    if (cleanNumber.length < 8 || cleanNumber.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid WhatsApp number with country code."
      });
    }

    const sessionPath = path.join(
      sessionsDir,
      cleanNumber
    );

    console.log(`📱 Pairing request: ${cleanNumber}`);

    const { state, saveCreds } =
      await useMultiFileAuthState(sessionPath);

    sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    let sessionSent = false;

    sock.ev.on(
      "connection.update",
      async ({ connection, lastDisconnect }) => {
        console.log(
          `🔌 ${cleanNumber} connection status: ${connection}`
        );

        if (connection === "open") {
          console.log(
            `✅ ${cleanNumber} WhatsApp connected!`
          );

          try {
            await new Promise(resolve =>
              setTimeout(resolve, 5000)
            );

            if (sessionSent) return;

            const sessionString =
              await buildSessionString(sessionPath);

            console.log(
              `📦 BONY XMD session generated. Length: ${sessionString.length}`
            );

            if (sessionString.length > 60000) {
              console.error(
                "❌ Session is too large to send."
              );
              return;
            }

            const recipient =
              sock.user?.id;

            if (!recipient) {
              throw new Error(
                "WhatsApp user ID unavailable."
              );
            }

            await sock.sendMessage(
              recipient,
              {
                text: sessionString
              }
            );

            sessionSent = true;

            console.log(
              `✅ BONY XMD session sent to ${cleanNumber}`
            );

            setTimeout(() => {
              try {
                sock.ws?.close();
              } catch {}
            }, 2000);

          } catch (error) {
            console.error(
              "❌ Session generation error:",
              error.message
            );
          }
        }

        if (
          connection === "close" &&
          !sessionSent
        ) {
          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          console.log(
            `❌ ${cleanNumber} connection closed. Status: ${statusCode || "unknown"}`
          );
        }
      }
    );

    const pairingCode =
      await sock.requestPairingCode(cleanNumber);

    console.log(
      `🔑 Pairing code for ${cleanNumber}: ${pairingCode}`
    );

    return res.json({
      success: true,
      phoneNumber: cleanNumber,
      pairingCode
    });

  } catch (error) {
    console.error("❌ Pairing error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Pairing failed."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log(
    "╔══════════════════════════════════╗"
  );
  console.log(
    "║       BONY XMD PAIRING SERVER    ║"
  );
  console.log(
    "║       Owner: BONY KE              ║"
  );
  console.log(
    "║       Port:", PORT, "                 ║"
  );
  console.log(
    "╚══════════════════════════════════╝"
  );
  console.log("");
  console.log(
    `🌐 Server running on port ${PORT}`
  );
  console.log("");
});
