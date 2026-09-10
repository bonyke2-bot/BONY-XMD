import fs from "fs";
import path from "path";
import zlib from "zlib";

const PREFIX = "BONYXMD~";

export async function importSession() {
  const sessionString = process.env.BONY_SESSION;

  if (!sessionString) {
    console.log("📁 No BONY_SESSION found. Using existing ./session");
    return;
  }

  if (!sessionString.startsWith(PREFIX)) {
    throw new Error("Invalid BONY_SESSION format.");
  }

  const encoded = sessionString.slice(PREFIX.length).trim();

  let compressed;

  try {
    compressed = Buffer.from(encoded, "base64url");
  } catch {
    throw new Error("Invalid BONY_SESSION base64url data.");
  }

  let json;

  try {
    json = zlib.gunzipSync(compressed).toString("utf8");
  } catch {
    throw new Error(
      "Could not decompress BONY_SESSION. The session string may be incomplete or corrupted."
    );
  }

  let payload;

  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error("Invalid BONY XMD session JSON.");
  }

  if (!payload || payload.version !== 1 || !payload.files) {
    throw new Error("Invalid BONY XMD session data.");
  }

  const sessionDir = path.resolve("./session");

  await fs.promises.rm(sessionDir, {
    recursive: true,
    force: true
  });

  await fs.promises.mkdir(sessionDir, {
    recursive: true
  });

  for (const [relativePath, base64Data] of Object.entries(payload.files)) {
    const filePath = path.resolve(sessionDir, relativePath);

    if (!filePath.startsWith(sessionDir + path.sep)) {
      throw new Error("Unsafe session file path.");
    }

    await fs.promises.mkdir(path.dirname(filePath), {
      recursive: true
    });

    await fs.promises.writeFile(
      filePath,
      Buffer.from(base64Data, "base64")
    );
  }

  console.log("✅ BONY XMD session imported successfully.");
}
