import { createHash } from 'node:crypto'

/**
 * Convierte un valor a su representación hexadecimal hasheada usando SHA-256.
 * @param {string} value - El valor a hashear.
 * @returns {string} El valor hasheado en formato hexadecimal.
 * @example
 * const hashed = hashValue('mySecretValue')
 * console.log(hashed) // 'a3f5c6e7b8d9e0f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7'
 */
export const hashValue = (value) => createHash('sha256').update(value).digest('hex')