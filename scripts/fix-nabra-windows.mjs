import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve("node_modules", "nabra-tts", "tsup.config.ts");

if (!fs.existsSync(configPath)) {
  console.error("[Basyir fix] File konfigurasi Nabra tidak ditemukan:", configPath);
  console.error("Pastikan npm sudah mengunduh node_modules/nabra-tts.");
  process.exit(1);
}

let source = fs.readFileSync(configPath, "utf8");

const oldLine = "      path: new URL(args.path.slice('inline-worker:'.length) + '.ts', `file://${args.resolveDir}/`).pathname,";
const newLine = "      path: fileURLToPath(new URL(args.path.slice('inline-worker:'.length) + '.ts', `file://${args.resolveDir}/`)),";
const importLine = "import { fileURLToPath } from 'node:url';";

if (source.includes(newLine) && source.includes(importLine)) {
  console.log("[Basyir fix] Konfigurasi Nabra sudah memakai jalur file yang kompatibel.");
  process.exit(0);
}

if (!source.includes(oldLine)) {
  console.error("[Basyir fix] Pola konfigurasi Nabra tidak cocok dengan versi yang terpasang.");
  console.error("Tidak ada file yang diubah. Kirim isi node_modules/nabra-tts/tsup.config.ts untuk diperiksa.");
  process.exit(1);
}

source = source.replace(oldLine, newLine);

if (!source.includes(importLine)) {
  source = importLine + "\n" + source;
}

fs.writeFileSync(configPath, source, "utf8");
console.log("[Basyir fix] Konfigurasi jalur worker Nabra diperbaiki:", configPath);
