import {
  buildWompiUrl,
  checkTransactionStatusById,
  validateChecksum
} from '#wompiClient.js'
import { describe, test } from 'node:test'
import { event, invalidEvent } from './mocks/wompiResponses.js'
import { AxiosError } from 'axios'
import assert from 'node:assert/strict'
import { createClient } from '#axios.js'
import nock from 'nock'

describe('buildWompiUrl', () => {
  test('retorna la url construida para consumir el endpoint de wompi con datos obligatorios', () => {
    const initConfig = {
      baseURL: 'https://api.example.com/example',
      publicKey: 'myPublicKey'
    }

    const wompiUrl = buildWompiUrl(initConfig, {
      reference: 'myReference',
      amountInCents: 10000000,
      currency: 'COP',
      integritySecret: 'myIntegritySecret',
    })

    const expectedUrl = 'https://api.example.com/example/?public-key=myPublicKey&reference=myReference&amount-in-cents=10000000&currency=COP&signature%3Aintegrity=6c2b5e0d35fb4ee79b36de8c1569245b93436c1ff885ff0dcd21c860033bb06a'

    assert.strictEqual(wompiUrl, expectedUrl)
  })

  test('retorna la url construida para consumir el endpoint de wompi con todos los datos', () => {
    const initConfig = {
      baseURL: 'https://api.example.com/example',
      publicKey: 'myPublicKey'
    }

    const wompiUrl = buildWompiUrl(initConfig, {
      reference: 'myReference',
      amountInCents: 10000000,
      currency: 'COP',
      integritySecret: 'myIntegritySecret',
      expirationDate: '2023-12-31T23:59:59Z',
      redirectUrl: 'https://example.com/redirect',
    })

    const expectedUrl = 'https://api.example.com/example/?public-key=myPublicKey&reference=myReference&amount-in-cents=10000000&currency=COP&signature%3Aintegrity=6c764a4c6acfa3e87eb1b3e3fd49c9ceea40d7d77cdeb8a8e876f8cbed4c3e1c&expiration-date=2023-12-31T23%3A59%3A59Z&redirect-url=https%3A%2F%2Fexample.com%2Fredirect'

    assert.strictEqual(wompiUrl, expectedUrl)
  })
})

describe('validateChecksum', () => {
  test('valida si el checksum proveido por wompi coincide con el checksum construido', () => {
    const eventKey = 'your-event-key'
    const isValid = validateChecksum(event, eventKey)
    assert.strictEqual(isValid, true)
  })

  test('valida si el checksum proveido por wompi no coincide con el checksum construido', () => {
    const eventKey = 'another-event-key'
    const isValid = validateChecksum(invalidEvent, eventKey)
    assert.strictEqual(isValid, false)
  })
})

describe('createClient', () => {
  test('crea una instancia de cliente de wompi', () => {
    const initConfig = {
      baseURL: 'https://api.example.com/example',
      privateKey: 'myPublicKey'
    }

    const client = createClient({ baseURL: initConfig.baseURL, publicKey: initConfig.privateKey })
    assert.strictEqual(typeof client, 'function')
  })
})

describe('checkTransactionStatusById', () => {
  test('mockea un parecido a una respuesta 200 de wompi', async () => {
    const mockUrl = 'https://api.example.com'
    const wompiClient = createClient({ baseURL: mockUrl, publicKey: 'myPublicKey' })
    const transactionId = 'transactionId123'
    const expectedResponse = {
      data: {
        status: 'approved',
        id: transactionId,
      },
    }

    nock(mockUrl)
      .get(`/transactions/${transactionId}`)
      .reply(200, expectedResponse)

    const response = await checkTransactionStatusById(wompiClient, transactionId)
    assert.deepEqual(response, expectedResponse)
  })
})

describe('Errores de peticion', () => {
  test('mockea un parecido a una respuesta de error de wompi', async () => {
    const mockUrl = 'https://api.example.com'
    const wompiClient = createClient({ baseURL: mockUrl, publicKey: 'myPublicKey' })
    const transactionReference = 'transactionReference123'
    const expectedResponse = {
      response: {
        data: {
          error: 'Transaction not found',
        }
      }
    }

    nock(mockUrl)
      .get(`/transactions/${transactionReference}`)
      .reply(404, expectedResponse)

    try {
      await checkTransactionStatusById(wompiClient, transactionReference)
    } catch (error) {
      if (error instanceof AxiosError) {
        assert.strictEqual(error.response?.data.error, expectedResponse.response.data.error)
      }
    }
  })

  test('retorna un error.message si la consulta falla', async () => {
    const mockUrl = 'https://api.example.com'
    const wompiClient = createClient({ baseURL: mockUrl, publicKey: 'myPublicKey' })
    const transactionReference = 'transactionReference123'
    const expectedErrorMessage = 'Network Error'

    nock(mockUrl)
      .get(`/transactions/${transactionReference}`)
      .replyWithError(expectedErrorMessage)

    try {
      await checkTransactionStatusById(wompiClient, transactionReference)
    } catch (error) {
      if (error instanceof AxiosError) {
        assert.strictEqual(error.message, expectedErrorMessage)
      }
    }
  })

  test('retorna un error.request si la consulta falla', async () => {
    const mockUrl = 'https://api.example.com'
    const wompiClient = createClient({ baseURL: mockUrl, publicKey: 'myPublicKey' })
    const transactionReference = 'transactionReference123'
    const expectedErrorMessage = 'Network Error'

    nock(mockUrl)
      .get(`/transactions/${transactionReference}`)
      .replyWithError(expectedErrorMessage)

    try {
      await checkTransactionStatusById(wompiClient, transactionReference)
    } catch (error) {
      if (error instanceof AxiosError) {
        assert.strictEqual(error.request, expectedErrorMessage)
      }
    }
  })

  test('retorna un error por defecto si la consulta falla', async () => {
    const wompiClient = createClient({ baseURL: '', publicKey: 'myPublicKey' })
    const transactionReference = 'transactionReference123'
    const expectedError = { error: 'Ocurrió un error al conectarse con Wompi. Revisa que la instancia axios esté correctamente configurada o inténtalo de nuevo más tarde' }

    const response = await checkTransactionStatusById(wompiClient, transactionReference)
    assert.deepEqual(response, expectedError)
  })
})