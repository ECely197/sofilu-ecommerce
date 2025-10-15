/** @type {'prod' | 'test'} */
const environment = 'prod'

export const event = {
  event: "transaction.updated",
  data: {
    transaction: {
      id: "1234-1610641025-49201",
      "amount_in_cents": 4490000,
      reference: "MZQ3X2DE2SMX",
      "customer_email": "juan.perez@gmail.com",
      currency: "COP",
      "payment_method_type": "NEQUI",
      "redirect_url": "https://mitienda.com.co/pagos/redireccion",
      status: "APPROVED",
      "shipping_address": null,
      "payment_link_id": null,
      "payment_source_id": null
    }
  },
  environment,
  signature: {
    properties: [
      "transaction.id",
      "transaction.status",
      "transaction.amount_in_cents"
    ],
    checksum: "c8b615c36d6002a81d1b911b22a800fef3d989a04e5d8ae6d4038575dbd9e489"
  },
  timestamp: 1530291411,
  "sent_at": "2018-07-20T16:45:05.000Z"
}

export const invalidEvent = {
  event: "transaction.updated",
  data: {
    transaction: {
      id: "1234-1610641025-49201",
      "amount_in_cents": 4490000,
      reference: "MZQ3X2DE2SMX",
      "customer_email": "juan.perez@gmail.com",
      currency: "COP",
      "payment_method_type": "NEQUI",
      "redirect_url": "https://mitienda.com.co/pagos/redireccion",
      status: "APPROVED",
      "shipping_address": null,
      "payment_link_id": null,
      "payment_source_id": null
    }
  },
  environment,
  signature: {
    properties: [
      "transaction.id",
      "transaction.status",
      "transaction.amount_in_cents"
    ],
    checksum: "7b9fe6147e8a88f6e80682e4d392069f663f3f9df52c45614f3c94fafb5a18d2"
  },
  timestamp: 1530291411,
  "sent_at": "2018-07-20T16:45:05.000Z"
}