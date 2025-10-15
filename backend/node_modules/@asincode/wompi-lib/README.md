# wompi-lib

[![🕵 Running Unit Tests](https://github.com/asincode-sas/wompi-lib/actions/workflows/unit-tests.yaml/badge.svg)](https://github.com/asincode-sas/wompi-lib/actions/workflows/unit-tests.yaml)

> Cliente ligero para conectar tu backend con la pasarela de pagos [Wompi](https://docs.wompi.co/) de manera sencilla y rápida.

---

`wompi-lib` es una librería desarrollada para facilitar la integración de cualquier backend (hecho en Node.js) 
con la pasarela de pagos Wompi, evitando tener que escribir funciones repetitivas cada vez que quieras 
realizar una acción común como iniciar un pago, validar un webhook o consultar una transacción.

Esta librería abstrae la complejidad de trabajar directamente con las URLs y firmas de Wompi, permitiéndote 
enfocarte en lo que realmente importa: construir productos funcionales y seguros sin reescribir el mismo código 
una y otra vez. Técnicamente, reduce lo que se conoce como **boilerplate**, o en español, *código repetitivo y 
rutinario necesario para hacer que algo funcione, pero que no aporta lógica de negocio en sí mismo*.

---

## Índice
- [Uso básico](#uso-básico)
- [`createClient`](#createclient)
- [`buildWompiUrl`](#buildwompiurl)
- [`validateChecksum`](#validatechecksum)
- [`checkTransactionStatusById`](#checktransactionstatusbyid)
- [Tipado (TypeScript)](#tipado-typescript)
- [Contribuciones](#contribuciones)

## Uso básico

Si sólo quieres generar la URL de pago o validar un webhook, puedes usar funciones independientes sin necesidad 
de instanciar el cliente completo:

```JS
import { buildWompiUrl } from 'wompi-lib'

// Generar URL de pago para redirigir a Wompi
const url = buildWompiUrl(
  {
    baseURL: 'https://checkout.wompi.co/p/',
    publicKey: 'PUBLIC_KEY',
  },
  {
    reference: 'ORDER123',
    amountInCents: 50000,
    currency: 'COP',
    integritySecret: 'SECRET_KEY',
    redirectUrl: 'https://miapp.com/gracias',
  }
)

console.log('Redirige al usuario a:', url)
```

```JS
import { validateChecksum } from 'wompi-lib'

// Validar checksum recibido en un webhook
export const webhookHandler = (req, res) => {
  const isValid = validateChecksum(req.body, 'EVENT_SECRET_KEY')

  if (!isValid) {
    return res.status(400).send('Firma inválida')
  }

  // Procesa el webhook
  console.log('Webhook válido:', body)
  res.status(200).send('Webhook procesado')
}
```

## `createClient`
`createClient` es una función que retorna una instancia preconfigurada de Axios lista para interactuar con la 
API de Wompi. Esta instancia incluye la autenticación necesaria mediante el uso de una llave pública (PUBLIC_KEY), 
lo que te permite realizar peticiones de forma segura a cualquier endpoint del backend de Wompi (como consultar el 
estado de una transacción, crear pagos o validar eventos).

Esta función es especialmente útil para centralizar la configuración y evitar repetir lógica de autenticación en múltiples 
lugares de tu código. Al generar una única instancia con `createClient`, puedes reutilizarla a lo largo de toda tu aplicación 
o servicio para realizar llamadas autenticadas de forma consistente.

Los parametros de configuración son:
- `baseURL`: URL base de la API de Wompi (sandbox o producción).
- `privateKey`: Clave privada de tu cuenta de Wompi (sandbox o producción).

```JS
// Instancia para sandbox
const wompiClientSandbox = createClient('https://sandbox.wompi.co/v1', 'PUBLIC_KEY')

// Instancia para producción
const wompiClient = createClient('https://prod.wompi.co/v1', 'PUBLIC_KEY')

// Consultar transacción por ID
const transaction = await checkTransactionStatusById(wompiClient, 'txn_abc123')
console.log(transaction)
```

## `buildWompiUrl`
Esta función se encarga de construir una URL de redirección al checkout de Wompi desde tu backend. Ideal para 
cuando necesitás generar un enlace y enviárselo al frontend o al usuario final para iniciar el pago.

### Ejemplo de uso:

```JS
const url = buildWompiUrl(
  {
    baseURL: 'https://checkout.wompi.co/p/',
    publicKey: 'PUBLIC_KEY',
  },
  {
    reference: 'ORDER987',
    amountInCents: 80000,
    currency: 'COP',
    integritySecret: 'INTEGRITY_SECRET',
    redirectUrl: 'https://miapp.com/thanks',
    expirationDate: '2025-04-30T23:59:00-05:00',
  }
)
```

### Parámetros:

| Parametro         | Tipo       | Obligatorio      | Descripción                                                                    |
|-------------------|------------|------------------|--------------------------------------------------------------------------------|
| `baseURL`         | `string`   | Sí               | URL base de Wompi Checkout (ej: https://checkout.wompi.co/p/)                  |
| `publicKey`       | `string`   | Sí               | Tu llave pública proporcionada por Wompi                                       |
| `reference`       | `string`   | Sí               | Referencia única para identificar la transacción                               |
| `amountInCents`   | `number`   | Sí               | Monto total de la transacción en centavos                                      |
| `currency`        | `string`   | Sí               | Moneda de la transacción (ej: 'COP', 'USD')                                    |
| `integritySecret` | `string`   | Sí               | Clave secreta para la firma de integridad                                      |
| `redirectUrl`     | `string`   | No               | URL a la que se redirigirá al usuario después de completar el pago             |
| `expirationDate`  | `string`   | No               | Fecha de expiración del pago en formato ISO 8601 (ej: '2025-04-30T23:59:00Z')  |

## `validateChecksum`
Esta función permite validar si el webhook recibido desde Wompi es auténtico. Compara el checksum enviado 
con uno localmente generado a partir de los datos sensibles del JSON y tu event key.

### Ejemplo de uso:

```JS
export const webhookHandler = (req, res) => {
    const isValid = validateChecksum(req.body, 'EVENT_KEY')
    
    if (isValid) {
        console.log('Webhook verificado correctamente')
        return res.status(200).send('Webhook procesado')
    }

    console.warn('Webhook inválido')
    res.status(400).send('Webhook inválido')
}
```

### Parámetros:
* `response`: Objeto JSON recibido en el webhook de Wompi.
* `eventKey`: Clave secreta proporcionada por Wompi para verificar la autenticidad del webhook.

## `checkTransactionStatusById`
Consulta el estado de una transacción a partir del ID único de la misma. Requiere una instancia 
creada con `createClient`.

```JS
const wompiClient = createClient('https://sandbox.wompi.co/v1', 'PUBLIC_KEY')
const transaction = await checkTransactionStatusById(wompiClient, 'xn_abc123')

console.log(transaction.status) // Ej: 'APPROVED'
```

### Parámetros:
* `wompiInstance`: Instancia de Axios creada con `createClient`.
* `transactionId`: ID único de la transacción (ej: 'xn_abc123').

## Tipado (TypeScript)
Esta librería incluye definiciones de tipos (`.d.ts`) para TypeScript y editores que soporten IntelliSense. 
Todos los parámetros y funciones exportadas tienen tipado explícito:

- `buildWompiUrl()`
- `createClient()`
- `validateChecksum()`
- `checkTransactionStatusById()`

## Contribuciones
¿Quieres mejorar esta librería o agregar nuevas funciones? ¡Bienvenido!

```BASH
# Clona el repo
git clone https://github.com/tu-user/wompi-lib

# Instala dependencias
npm install

# Ejecuta pruebas o agrega las tuyas
npm test
```

Antes de hacer una PR, asegúrate de:
- Seguir las convenciones de código y estilo del proyecto.
- Incluir pruebas para cualquier nueva funcionalidad o corrección de errores.
- Usa `prettier` o `eslint` para formatear tu código.
- Documentar cualquier cambio significativo en el README.md o en los comentarios del código.
