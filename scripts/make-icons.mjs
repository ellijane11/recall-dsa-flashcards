// Generates PNG app icons with no dependencies (zlib only).
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const BG = [232, 131, 74] // orange
const FG = [243, 237, 226] // cream
// 5x7 blocky "R"
const R = ['1111.', '1...1', '1...1', '1111.', '1.1..', '1..1.', '1...1']

function crc32(buf) {
  let c, crc = ~0
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return ~crc >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function icon(size, maskable) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  const glyphH = size * (maskable ? 0.4 : 0.56)
  const cell = Math.floor(glyphH / 7)
  const gw = cell * 5
  const gh = cell * 7
  const x0 = Math.floor((size - gw) / 2)
  const y0 = Math.floor((size - gh) / 2)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - x0) / cell)
      const gy = Math.floor((y - y0) / cell)
      const on = x >= x0 && y >= y0 && gx < 5 && gy < 7 && R[gy][gx] === '1'
      const [r, g, b] = on ? FG : BG
      const o = y * (size * 3 + 1) + 1 + x * 3
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', icon(192, false))
writeFileSync('public/icon-512.png', icon(512, false))
writeFileSync('public/icon-maskable-512.png', icon(512, true))
writeFileSync('public/apple-touch-icon.png', icon(180, false))
console.log('icons written')
