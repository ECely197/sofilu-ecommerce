import { AxiosError } from 'axios'
import { createClient } from './axios.js'
import { hashValue } from './utils/hashValue.js'
import { stringify } from 'qs'

/**
 * Construye la URL de Wompi para redirigir al usuario a la página de pago.
 * @typedef {object} WompiUrlOptions
 * @property {string} reference - La referencia de la transacción.
 * @property {number} amountInCents - El monto de la transacción.
 * @property {string} currency - La moneda de la transacción usando el formato ISO 4217 (ej. 'COP', 'USD').
 * @property {string} integritySecret - El secreto de integridad para la transacción.
 * @property {ReturnType<typeof Date>} [expirationDate] - La fecha de expiración de la transacción.
 * @property {string} [redirectUrl] - La URL a la que se redirigirá al usuario después del pago.
 * @param {{ baseURL: string, publicKey: string }} initialConfig - Objeto de configuración inicial para la URL de Wompi.
 * @param {WompiUrlOptions} wompiUrlOptions - Objeto de opciones obligatorias para construir la URL de Wompi.
 * @returns {string} La URL de Wompi para redirigir al usuario a la página de pago.
 * @example
 * const wompiUrl = buildWompiUrl(
 *   { baseURL: 'https://wompi.co', publicKey: 'your-public-key' },
 *   {
 *     reference: 'transaction-12345',
 *     amountInCents: 10000,
 *     currency: 'COP',
 *     integritySecret: 'your-integrity-secret',
 *     expirationDate: new Date('2023-12-31T23:59:59Z'),
 *     redirectUrl: 'https://your-redirect-url.com'
 *   }
 * )
 * console.log(wompiUrl) // 'https://wompi.co/?public-key=your-public-key&reference=transaction-12345&amount-in-cents=10000&currency=COP&signature:integrity=hashed-value&expiration-date=2023-12-31T23:59:59Z&redirect-url=https://your-redirect-url.com'
 */
export const buildWompiUrl = ({ baseURL, publicKey }, wompiUrlOptions) => {
  const {
    reference,
    amountInCents,
    currency,
    integritySecret,
    expirationDate,
    redirectUrl
  } = wompiUrlOptions
  const integritySignature = hashValue([reference, amountInCents, currency, integritySecret, expirationDate].join(''))

  const params = stringify({
    'public-key': publicKey,
    reference,
    'amount-in-cents': amountInCents,
    currency,
    'signature:integrity': integritySignature,
    'expiration-date': expirationDate,
    'redirect-url': redirectUrl
  })

  return `${baseURL}/?${params}`
}

/**
 * Valida el checksum de la respuesta de Wompi contra el evento de la transacción.
 * Dicha validación es necesaria para asegurar que la respuesta no ha sido manipulada.
 * @typedef {object} WompiTransactionResponse
 * @property {string} event - El tipo de evento de la transacción
 * @property {object} data - El contenedor de datos de la transacción
 * @property {object} data.transaction - Los detalles de la transacción
 * @property {string} data.transaction.id - El identificador único de la transacción (solo lectura)
 * @property {string} data.transaction.status - El estado actual de la transacción
 * @property {number} data.transaction.amount_in_cents - El monto de la transacción en centavos
 * @property {string} data.transaction.redirect_url - La URL a la que se redirigirá al usuario después del pago
 * @property {string} data.transaction.reference - El código de referencia de la transacción
 * @property {string} data.transaction.payment_method_type - El tipo de método de pago utilizado
 * @property {string | null} [data.transaction.shipping_address] - La dirección de envío
 * @property {string | null} [data.transaction.payment_link_id] - El ID del enlace de pago
 * @property {string | null} [data.transaction.payment_source_id] - El ID de la fuente de pago
 * @property {'prod' | 'test'} environment - El entorno donde se procesó la transacción
 * @property {object} signature - Los detalles de verificación de firma
 * @property {Array<string>} signature.properties - Array de propiedades usadas para la firma
 * @property {string} signature.checksum - El checksum de verificación
 * @property {number} timestamp - La marca de tiempo Unix de la respuesta
 * @property {string} sent_at - La marca de tiempo ISO cuando se envió la respuesta
 * @param {WompiTransactionResponse} response - La respuesta de la transacción de Wompi.
 * @param {string} eventKey - La clave del evento que provee Wompi para la validación.
 * @returns {boolean} Retorna true si el checksum es válido, de lo contrario false.
 * @example
 * const isValid = validateChecksum(response, 'your-event-key')
 * console.log(isValid) // true o false dependiendo de la validez del checksum
 */
export const validateChecksum = (response, eventKey) => {
  const {
    signature: { checksum },
    data: {
      transaction: {
        id,
        amount_in_cents: amountInCents,
        status
      }
    },
    timestamp
  } = response

  const builtChecksum = hashValue(`${id}${status}${amountInCents}${timestamp}${eventKey}`)
  return builtChecksum === checksum
}

/**
 * Consulta la API de Wompi usando un endpoint y un filtro.
 * @async
 * @param {ReturnType<typeof createClient>} wompiInstance - La instancia de axios de Wompi configurada.
 * @param {string} endpoint - El endpoint de la API de Wompi a consultar.
 * @throws {Error} Si la consulta falla, lanza un error con el mensaje correspondiente.
 * @returns {Promise<unknown>} La respuesta de la API de Wompi.
 * @example
 * const wompiInstance = createClient('https://api.wompi.co/v1')
 * const response = await wompiRequest(wompiInstance, '/transactions/transaction-id')
 * console.log(response) // La respuesta de la API de Wompi
 */
const transactionRequest = async (wompiInstance, endpoint) => {
  try {
    const { data } = await wompiInstance.get(endpoint)
    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(error.response)
        return error.response.data
      } else if (error.request) {
        console.error(error.request)
        return error.request
      }
    }
    return {
      error: 'Ocurrió un error al conectarse con Wompi. Revisa que la instancia axios esté correctamente configurada o inténtalo de nuevo más tarde'
    }
  }
}

/**
 * Consulta el estado de una transacción en Wompi usando el ID de la transacción.
 * @async
 * @param {ReturnType<typeof createClient>} wompiInstance - La instancia de axios de Wompi configurada.
 * @param {string} transactionId - El ID de la transacción a consultar.
 * @throws {Error} Si la consulta falla, lanza un error con el mensaje correspondiente.
 * @returns {ReturnType<typeof transactionRequest>} La respuesta de la API de Wompi.
 * @example
 * const wompiInstance = createClient('https://api.wompi.co/v1')
 * const response = await checkTransactionStatusById(wompiInstance, 'transaction-id')
 * console.log(response) // La respuesta de la API de Wompi
 */
export const checkTransactionStatusById = (wompiInstance, transactionId) =>
  transactionRequest(wompiInstance, `/transactions/${transactionId}`)