require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { HorizontalScroll } = require('../src/components/ui/horizontal-scroll.tsx')

test('the wheel scrolls overflowing choices sideways and releases vertical scrolling at both edges', () => {
  const originalRef = React.useRef, originalEffect = React.useEffect
  let onWheel, cleanup, removed = false, prevented = 0, listenerOptions
  const element = { scrollLeft: 0, scrollWidth: 600, clientWidth: 200,
    addEventListener(type, handler, options) { assert.equal(type, 'wheel'); onWheel = handler; listenerOptions = options },
    removeEventListener(type, handler) { removed = type === 'wheel' && handler === onWheel },
  }
  React.useRef = () => ({ current: element })
  React.useEffect = effect => { cleanup = effect() }
  try { HorizontalScroll({}) } finally { React.useRef = originalRef; React.useEffect = originalEffect }
  const wheel = (deltaY, overrides = {}) => onWheel({ deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false, preventDefault() { prevented++ }, ...overrides })
  assert.deepEqual(listenerOptions, { passive: false })
  wheel(80); assert.equal(element.scrollLeft, 80); assert.equal(prevented, 1)
  wheel(80, { ctrlKey: true }); assert.equal(element.scrollLeft, 80); assert.equal(prevented, 1)
  wheel(1, { deltaX: 100 }); assert.equal(element.scrollLeft, 80); assert.equal(prevented, 1)
  wheel(1000); assert.equal(element.scrollLeft, 400)
  const atEnd = prevented
  wheel(80); assert.equal(prevented, atEnd, 'At the end, the modal can scroll vertically')
  wheel(-1000); assert.equal(element.scrollLeft, 0)
  const atStart = prevented
  wheel(-80); assert.equal(prevented, atStart)
  wheel(2, { deltaMode: 1 }); assert.equal(element.scrollLeft, 32, 'Line-based mice use CSS pixel distances')
  element.scrollLeft = 0; element.scrollWidth = 150
  const noOverflow = prevented
  wheel(80); assert.equal(element.scrollLeft, 0); assert.equal(prevented, noOverflow)
  cleanup(); assert.equal(removed, true)
})
