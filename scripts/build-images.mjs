// Web images for the site: AVIF + WebP at the widths each plate is shown at.
// Sources: kit masters (images/master), cleaned / upscaled real photos
// (scripts/out/plates, from `npm run prepare-images`) and the approved logo PNG.
// Writes public/img/<name>-<V>-<width>.{avif,webp} and src/data/images.json.
// Bump V whenever a plate changes: /img is cached by browsers for 30 days.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public/img');
const V = 'v1';

const PLATES = [
  { name: 'studio', src: 'images/master/hero-studio.png', widths: [960, 1672] },
  { name: 'portrait', src: 'images/master/hero-portrait-D.png', widths: [560, 840, 1135], alpha: true },
  { name: 'interieur', src: 'scripts/out/plates/interieur.png', widths: [800, 1300, 1900, 2700] },
  { name: 'ongles', src: 'scripts/out/plates/ongles-fuchsia.png', widths: [760, 1150, 1524] },
  { name: 'equipe', src: 'images/originals/equipe-original.png', widths: [700, 1000, 1346], crop: [0, 0, 1346, 1660] },
  { name: 'equipe-flou', src: 'images/originals/equipe-original.png', widths: [160], crop: [0, 0, 1346, 1660], blur: true },
  { name: 'reservation', src: 'images/master/reservation-scene.png', widths: [900, 1300, 1672] },
  { name: 'reservation-flou', src: 'images/master/reservation-scene.png', widths: [200], blur: true },
  { name: 'interieur-flou', src: 'scripts/out/plates/interieur.png', widths: [220], blur: true },
  { name: 'ongles-flou', src: 'scripts/out/plates/ongles-fuchsia.png', widths: [160], blur: true },
  { name: 'telephone', src: 'scripts/out/plates/telephone.png', widths: [420, 790], alpha: true, trim: true },
  { name: 'galerie-fuchsia', src: 'scripts/out/plates/ongles-fuchsia.png', widths: [640, 1100] },
  { name: 'galerie-bleu-jaune', src: 'scripts/out/plates/ongles-bleu-jaune.png', widths: [640, 1100] },
  { name: 'galerie-fraises', src: 'scripts/out/plates/ongles-fraises.png', widths: [640, 1100] },
  { name: 'galerie-regard', src: 'scripts/out/plates/regard.png', widths: [640, 1100] },
  { name: 'logo', src: 'brand/La-Dependance-Logo-Transparente.png', widths: [320, 520], alpha: true, trim: true },
  { name: 'monogramme', src: 'brand/La-Dependance-Logo-Transparente.png', widths: [160, 320], alpha: true, crop: [700, 90, 1076, 500], trim: true },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const meta = {};
  for (const plate of PLATES) {
    let base = sharp(path.join(ROOT, plate.src));
    if (plate.crop) {
      const [x0, y0, x1, y1] = plate.crop;
      base = sharp(await base.extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).toBuffer());
    }
    let offset = [0, 0];
    if (plate.trim) {
      const { data, info } = await base.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      offset = [minX, minY];
      base = sharp(await base.extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }).toBuffer());
    }
    const info = await base.metadata();
    const files = [];
    for (const w of [...new Set(plate.widths.map((width) => Math.min(width, info.width)))]) {
      let pipe = base.clone().resize({ width: w, kernel: 'lanczos3' });
      if (plate.blur) pipe = pipe.blur(6).modulate({ brightness: 0.92 });
      const stem = `${plate.name}-${V}-${w}`;
      await pipe.clone().avif({ quality: plate.blur ? 40 : 58, effort: 6 }).toFile(path.join(OUT, `${stem}.avif`));
      await pipe.clone().webp({ quality: plate.blur ? 60 : 80, alphaQuality: 90, effort: 6 }).toFile(path.join(OUT, `${stem}.webp`));
      files.push(w);
    }
    meta[plate.name] = { width: info.width, height: info.height, widths: files, offset, v: V };
    console.log(plate.name, info.width, 'x', info.height, files.join(','), plate.trim ? `trim@${offset}` : '');
  }
  await fs.writeFile(path.join(ROOT, 'src/data/images.json'), JSON.stringify(meta, null, 2));
}

main();
