const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get("/generate", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ error: "Enter number with country code" });

  const dir = `./sessions/${number}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(number);
    res.json({ pair_code: code });
  } else {
    res.json({ message: "✅ Already registered" });
  }

  sock.ev.on("creds.update", saveCreds);
});

app.get("/api/session-count", (req, res) => {
  const count = fs.existsSync("./sessions")
    ? fs.readdirSync("./sessions").length
    : 0;

  res.json({
    schemaVersion: 1,
    label: "SESSION",
    message: String(count),
    color: "black",
    labelColor: "000000"
  });
});

app.use(express.static("public"));
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
