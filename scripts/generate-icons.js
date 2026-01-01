const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const iconPath = path.join(publicDir, 'icon.svg');

async function generateIcons() {
  console.log('Generando iconos PWA...');

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);

    await sharp(iconPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generado: icon-${size}x${size}.png`);
  }

  // Generar favicon.ico (tamaño 32x32)
  const faviconPath = path.join(publicDir, 'favicon.ico');
  await sharp(iconPath)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);

  console.log('✓ Generado: favicon.ico');

  // Generar apple-touch-icon.png (180x180)
  const appleTouchIconPath = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(iconPath)
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);

  console.log('✓ Generado: apple-touch-icon.png');

  console.log('\n¡Todos los iconos generados exitosamente!');
}

generateIcons().catch(console.error);
