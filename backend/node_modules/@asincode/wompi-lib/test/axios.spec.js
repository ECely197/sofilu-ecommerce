import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '#axios.js'

describe('axios tests suite', () => {
  test('valida que el tipo de dato sea una funcion', () => {
    assert.strictEqual(typeof createClient, 'function')
  })

  test('retorna una instancia de axios', () => {
    const axios = createClient({
      baseURL: 'https://api.example.com/example',
      publicKey: 'myPublicKey',
    })
    assert.strictEqual(typeof axios, 'function')
    assert.strictEqual(typeof axios.get, 'function')
  })
})