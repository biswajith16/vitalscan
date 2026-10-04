import { mkdir, copyFile, readdir, access, writeFile } from "node:fs/promises";
import sharp from "sharp";
await mkdir("public/mediapipe/wasm", { recursive: true });
for (const file of await readdir("node_modules/@mediapipe/tasks-vision/wasm")) {
  if (/\.(wasm|js)$/.test(file))
    await copyFile(
      `node_modules/@mediapipe/tasks-vision/wasm/${file}`,
      `public/mediapipe/wasm/${file}`,
    );
}
const model = "public/mediapipe/face_landmarker.task";
try {
  await access(model);
} catch {
  const response = await fetch(
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  );
  if (!response.ok)
    throw new Error(`Model download failed: ${response.status}`);
  await writeFile(model, Buffer.from(await response.arrayBuffer()));
}
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon.png", 32],
]) {
  await sharp("public/icon.svg")
    .resize(size, size)
    .png()
    .toFile(`public/${name}`);
}
console.log("Local face model, WASM runtime, and application icons are ready.");
