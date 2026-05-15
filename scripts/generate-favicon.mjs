import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve('C:/Users/justj/Downloads/prayercycles icon.png')

// Generate a 32x32 favicon.ico-style PNG
await sharp(src).resize(48, 48).png().toFile(resolve(root, 'public/favicon.png'))
console.log('Generated favicon.png')
