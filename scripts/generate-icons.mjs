import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const svg = readFileSync(resolve(root, 'public/favicon.svg'))

// Create icon with dark background matching the app
const sizes = [192, 512]
const padding = 0.2 // 20% padding around the icon

for (const size of sizes) {
  const iconPadding = Math.round(size * padding)
  const innerSize = size - iconPadding * 2

  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0f172a"/>
    </svg>`
  )

  await sharp(bg)
    .composite([{
      input: await sharp(svg).resize(innerSize, innerSize).toBuffer(),
      top: iconPadding,
      left: iconPadding,
    }])
    .png()
    .toFile(resolve(root, `public/icons/icon-${size}.png`))

  console.log(`Generated icon-${size}.png`)
}

// Apple touch icon (180x180, no rounding)
const appleSize = 180
const applePadding = Math.round(appleSize * 0.2)
const appleInner = appleSize - applePadding * 2

const appleBg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}">
    <rect width="${appleSize}" height="${appleSize}" fill="#0f172a"/>
  </svg>`
)

await sharp(appleBg)
  .composite([{
    input: await sharp(svg).resize(appleInner, appleInner).toBuffer(),
    top: applePadding,
    left: applePadding,
  }])
  .png()
  .toFile(resolve(root, 'public/icons/apple-touch-icon.png'))

console.log('Generated apple-touch-icon.png')
