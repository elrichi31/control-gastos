const { test } = require('node:test')
const assert = require('node:assert/strict')
const sharp = require('sharp')
const path = require('node:path')

test('favicon contains a visible wallet with transparent background', async () => {
  for (const file of ['icon.svg', 'favicon.png', 'favicon.ico']) {
    const { data, info } = await sharp(path.join(__dirname, '../public', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(data[3], 0, `${file}: corner must be transparent`)
    let transparent = 0, visible = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) transparent++
      if (data[i + 3] > 128) visible++
    }
    assert.ok(transparent > info.width * info.height * 0.5, `${file}: remove the background tile`)
    assert.ok(visible > info.width * info.height * 0.1, `${file}: wallet must remain visible`)
  }
})
