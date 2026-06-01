import nacl from 'tweetnacl'

const ENC_PREFIX = 'enc:'

let _key: Uint8Array | null = null

export function setCryptoKey(key: Uint8Array) {
  if (key.length !== nacl.secretbox.keyLength) {
    throw new Error(`Key must be ${nacl.secretbox.keyLength} bytes`)
  }
  _key = key
}

export function getCryptoKey(): Uint8Array | null {
  return _key
}

export function hasCryptoKey(): boolean {
  return _key !== null
}

export function generateKey(): Uint8Array {
  return nacl.randomBytes(nacl.secretbox.keyLength)
}

export function encryptString(plaintext: string): string {
  if (!_key) throw new Error('Encryption key not initialized')
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
  const messageBytes = new TextEncoder().encode(plaintext)
  const ciphertext = nacl.secretbox(messageBytes, nonce, _key)
  const combined = new Uint8Array(nonce.length + ciphertext.length)
  combined.set(nonce)
  combined.set(ciphertext, nonce.length)
  return ENC_PREFIX + uint8ToBase64(combined)
}

export function decryptString(encrypted: string): string {
  if (!_key) throw new Error('Encryption key not initialized')
  if (!encrypted.startsWith(ENC_PREFIX)) return encrypted
  const combined = base64ToUint8(encrypted.slice(ENC_PREFIX.length))
  const nonce = combined.slice(0, nacl.secretbox.nonceLength)
  const ciphertext = combined.slice(nacl.secretbox.nonceLength)
  const plaintext = nacl.secretbox.open(ciphertext, nonce, _key)
  if (!plaintext) throw new Error('Decryption failed — wrong key or corrupted data')
  return new TextDecoder().decode(plaintext)
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX)
}

export function encryptBlob(plaintext: string): string {
  return encryptString(plaintext)
}

export function decryptBlob(encrypted: string): string {
  return decryptString(encrypted)
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
