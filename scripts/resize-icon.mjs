import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve('C:/Users/justj/Downloads/Prayercycles icon 2.png')

await sharp(src).resize(512, 512).png().toFile(resolve(root, 'public/icons/icon-512.png'))
console.log('Generated icon-512.png')

await sharp(src).resize(192, 192).png().toFile(resolve(root, 'public/icons/icon-192.png'))
console.log('Generated icon-192.png')

await sharp(src).resize(180, 180).png().toFile(resolve(root, 'public/icons/apple-touch-icon.png'))
console.log('Generated apple-touch-icon.png')
