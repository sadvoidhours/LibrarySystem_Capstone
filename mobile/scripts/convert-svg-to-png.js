const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.findIndex((arg) => arg === name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
};

const inputDir = path.resolve(getArg('--input', './assets/icons-svg'));
const outputDir = path.resolve(getArg('--output', './assets/icons'));
const size = Number(getArg('--size', '24'));

if (!Number.isFinite(size) || size <= 0) {
  console.error('Invalid --size value.');
  process.exit(1);
}

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((file) => file.toLowerCase().endsWith('.svg'));

if (files.length === 0) {
  console.log('No SVG files found.');
  process.exit(0);
}

const convertOne = async (file) => {
  const svgPath = path.join(inputDir, file);
  const baseName = path.basename(file, '.svg');
  const pngPath = path.join(outputDir, `${baseName}.png`);

  await sharp(svgPath)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(pngPath);
};

(async () => {
  try {
    await Promise.all(files.map(convertOne));
    console.log(`Converted ${files.length} SVG file(s) to PNG in ${outputDir}.`);
  } catch (err) {
    console.error('Failed to convert SVGs:', err.message || err);
    process.exit(1);
  }
})();
