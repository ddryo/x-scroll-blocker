import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, "../public/icons");
const source = resolve(iconsDir, "icon-128.png");

const sizes = [16, 32, 48];

for (const size of sizes) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, `icon-${size}.png`));
}

console.log(`Generated icons: ${sizes.map((s) => `${s}x${s}`).join(", ")}`);
