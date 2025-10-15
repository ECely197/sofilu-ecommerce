import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { hashValue } from '#utils/hashValue.js'

describe('hashValue tests suite', () => {
  test('hashea un valor a su representación hexadecimal', () => {
    const value = 'mySecretValue'
    const expectedHash = '81fd79694e4ae88a1a3890d6b260874fe12440326dbc51362f5181199c9d5e84'
    const hashedValue = hashValue(value)
    assert.strictEqual(hashedValue, expectedHash)
  })

  test('compara un valor no igual a su hash', () => {
    const value = 'mySecretValue2'
    const expectedHash = '81fd79694e4ae88a1a3890d6b260874fe12440326dbc51362f5181199c9d5e84'
    const hashedValue = hashValue(value)
    const isNotEqual = hashedValue === expectedHash
    assert.strictEqual(isNotEqual, false)
  })
})